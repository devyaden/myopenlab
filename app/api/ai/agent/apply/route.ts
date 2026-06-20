import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Commits an agent proposal the user approved in the preview.
//   target "canvas"   → a diagram playbook (canvas_data).
//   target "document" → a rich document page (document_data.lexical_state).
// create → new canvas row (+ its content). update → overwrite content and write
// a canvas_history snapshot (so the agent's edits get undo/history).
const diagram = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  nodeStyles: z.record(z.any()).optional(),
});

// The document body is a permissive block list; lib/agent/document-blocks.ts is
// the authority that converts + coerces it.
const docBody = z.array(z.any());

const applySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create"),
    target: z.enum(["canvas", "document", "directory"]).optional(),
    name: z.string().min(1).max(120),
    code: z.string().max(40).nullable().optional(),
    folder_id: z.string().uuid().nullable().optional(),
    diagram: diagram.optional(),
    body: docBody.optional(),
    // Phase 5d: directory create payload.
    directory_kind: z.enum(["person", "role"]).optional(),
    people: z.array(z.record(z.any())).optional(),
  }),
  z.object({
    kind: z.literal("update"),
    target: z.enum(["canvas", "document"]).optional(),
    canvas_id: z.string().uuid(),
    diagram: diagram.optional(),
    body: docBody.optional(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const parsed = applySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Directory proposals (target: "directory") ───────────────────────────
    // A directory is a Table canvas (canvas_type "table") marked with a
    // directory_kind, seeded with columns + people/role rows. Create only.
    if (input.target === "directory") {
      if (input.kind !== "create") {
        return NextResponse.json(
          { error: "Directories support create only" },
          { status: 400 }
        );
      }
      const kind = input.directory_kind === "role" ? "role" : "person";
      const canvasId = crypto.randomUUID();
      const { generateCanvasCode } = await import("@/lib/refs/codes");

      let inserted = false;
      let cErr: any = null;
      for (let attempt = 0; attempt < 4 && !inserted; attempt++) {
        const code = await generateCanvasCode(supabase, user.id, {
          explicit: attempt === 0 ? input.code : null,
          name: input.name,
        });
        const res = await supabase.from("canvas").insert({
          id: canvasId,
          name: input.name,
          user_id: user.id,
          folder_id: input.folder_id ?? null,
          canvas_type: "table",
          visibility: "private",
          code,
          directory_kind: kind,
        });
        if (!res.error) inserted = true;
        else if (res.error.code === "23505") cErr = res.error;
        else {
          cErr = res.error;
          break;
        }
      }
      if (!inserted) throw cErr;

      // Columns: the first maps to the row's `label` (the person/role name);
      // the rest are free Text fields keyed by their title.
      const colTitles =
        kind === "role"
          ? ["Name", "Description", "Reports To"]
          : ["Name", "Email", "Role", "Manager"];
      const columns = colTitles.map((title, i) => ({
        id: crypto.randomUUID(),
        title,
        type: "Text",
        required: false,
        order: i,
        canvas_id: canvasId,
        data_key: i === 0 ? "label" : title,
      }));
      const { error: colErr } = await supabase
        .from("column_definition")
        .insert(columns);
      if (colErr) throw colErr;

      // Rows: each person/role is a table row (a genericNode). Its name is the
      // node label (so @-mentions can display it); extra fields map onto the
      // non-Name columns.
      const people = Array.isArray(input.people) ? input.people : [];
      const nodes = people.map((p: any, i: number) => {
        const data: Record<string, any> = {
          label: String(p?.name ?? p?.label ?? p?.Name ?? `Person ${i + 1}`),
          shape: "rectangle",
        };
        for (let c = 1; c < colTitles.length; c++) {
          const key = colTitles[c]; // e.g. "Reports To"
          // Accept the column title, its lowercase form, AND a camelCase variant
          // (the agent's tool schema documents keys like `reportsTo`).
          const camel = key
            .split(/\s+/)
            .map((w, idx) =>
              idx === 0
                ? w.charAt(0).toLowerCase() + w.slice(1)
                : w.charAt(0).toUpperCase() + w.slice(1)
            )
            .join("");
          const v = p?.[key] ?? p?.[key.toLowerCase()] ?? p?.[camel] ?? "";
          data[key] = typeof v === "string" ? v : v == null ? "" : String(v);
        }
        return {
          id: crypto.randomUUID(),
          type: "genericNode",
          data,
          position: { x: 80 + (i % 5) * 180, y: 80 + Math.floor(i / 5) * 120 },
          parentNode: null,
        };
      });
      const { error: dErr } = await supabase.from("canvas_data").insert({
        canvas_id: canvasId,
        nodes,
        edges: [],
        styles: {},
        version: 1,
        updated_at: new Date().toISOString(),
      });
      if (dErr) throw dErr;

      return NextResponse.json({ ok: true, canvasId });
    }

    // ── Document proposals (target: "document") ──────────────────────────────
    if (input.target === "document") {
      const { blocksToTiptapDoc } = await import("@/lib/agent/document-blocks");
      const now = new Date().toISOString();
      const doc = blocksToTiptapDoc(input.body ?? []);

      if (input.kind === "create") {
        const canvasId = crypto.randomUUID();
        const { generateCanvasCode } = await import("@/lib/refs/codes");

        // Same code-assignment + 23505 retry as the canvas create path.
        let inserted = false;
        let cErr: any = null;
        for (let attempt = 0; attempt < 4 && !inserted; attempt++) {
          const code = await generateCanvasCode(supabase, user.id, {
            explicit: attempt === 0 ? input.code : null,
            name: input.name,
          });
          const res = await supabase.from("canvas").insert({
            id: canvasId,
            name: input.name,
            user_id: user.id,
            folder_id: input.folder_id ?? null,
            canvas_type: "document",
            visibility: "private",
            code,
          });
          if (!res.error) inserted = true;
          else if (res.error.code === "23505") cErr = res.error;
          else {
            cErr = res.error;
            break;
          }
        }
        if (!inserted) throw cErr;

        const wrapper = { state: "", json: doc, controls: {}, page: {} };
        const { error: dErr } = await supabase.from("document_data").insert({
          canvas_id: canvasId,
          lexical_state: JSON.stringify(wrapper),
          version: 1,
          updated_at: now,
        });
        if (dErr) throw dErr;

        await reconcileDocumentReferences(supabase, user.id, canvasId, input.body ?? []);
        return NextResponse.json({ ok: true, canvasId });
      }

      // update document — ownership check.
      const { data: owned } = await supabase
        .from("canvas")
        .select("id")
        .eq("id", input.canvas_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!owned) {
        return NextResponse.json(
          { error: "Document not found or no access" },
          { status: 404 }
        );
      }

      // Preserve the existing toolbar/page geometry; only the body changes.
      const { data: current } = await supabase
        .from("document_data")
        .select("lexical_state, version")
        .eq("canvas_id", input.canvas_id)
        .maybeSingle();
      let controls: any = {};
      let page: any = {};
      if (current?.lexical_state != null) {
        try {
          const w =
            typeof current.lexical_state === "string"
              ? JSON.parse(current.lexical_state)
              : current.lexical_state;
          controls = w?.controls ?? {};
          page = w?.page ?? {};
        } catch {
          /* keep defaults */
        }
      }
      const wrapper = { state: "", json: doc, controls, page };
      const nextVersion = (current?.version ?? 1) + 1;

      if (current) {
        const { error: uErr } = await supabase
          .from("document_data")
          .update({
            lexical_state: JSON.stringify(wrapper),
            version: nextVersion,
            updated_at: now,
          })
          .eq("canvas_id", input.canvas_id);
        if (uErr) throw uErr;
      } else {
        const { error: iErr } = await supabase.from("document_data").insert({
          canvas_id: input.canvas_id,
          lexical_state: JSON.stringify(wrapper),
          version: 1,
          updated_at: now,
        });
        if (iErr) throw iErr;
      }

      // History snapshot (canvas_history.data is generic JSONB).
      await supabase.from("canvas_history").insert({
        id: crypto.randomUUID(),
        canvas_id: input.canvas_id,
        data: { document: wrapper },
        version: nextVersion,
      });

      await reconcileDocumentReferences(supabase, user.id, input.canvas_id, input.body ?? []);
      // Return the new version so the open editor's store can adopt it and not
      // false-conflict on the user's next save (optimistic-concurrency check).
      return NextResponse.json({
        ok: true,
        canvasId: input.canvas_id,
        version: nextVersion,
      });
    }

    // ── Canvas (diagram) proposals ───────────────────────────────────────────
    if (!input.diagram) {
      return NextResponse.json(
        { error: "A diagram is required for a canvas proposal" },
        { status: 400 }
      );
    }

    if (input.kind === "create") {
      const canvasId = crypto.randomUUID();

      // Phase 2: assign a stable human-readable code. The agent may propose one;
      // the server is the authority on uniqueness. Retry on the unique-violation
      // (23505) a concurrent create could cause; never block creation on it.
      const { generateCanvasCode } = await import("@/lib/refs/codes");
      let inserted = false;
      let cErr: any = null;
      for (let attempt = 0; attempt < 4 && !inserted; attempt++) {
        const code = await generateCanvasCode(supabase, user.id, {
          explicit: attempt === 0 ? input.code : null, // only honor the explicit code on the first try
          name: input.name,
        });
        const res = await supabase.from("canvas").insert({
          id: canvasId,
          name: input.name,
          user_id: user.id,
          folder_id: input.folder_id ?? null,
          canvas_type: "hybrid",
          visibility: "private",
          code,
        });
        if (!res.error) {
          inserted = true;
        } else if (res.error.code === "23505") {
          cErr = res.error; // code collided — loop regenerates a fresh serial
        } else {
          cErr = res.error;
          break; // a non-uniqueness error won't be fixed by retrying
        }
      }
      if (!inserted) throw cErr;

      const { error: dErr } = await supabase.from("canvas_data").insert({
        canvas_id: canvasId,
        nodes: input.diagram.nodes,
        edges: input.diagram.edges,
        styles: input.diagram.nodeStyles ?? {},
        version: 1,
        updated_at: new Date().toISOString(),
      });
      if (dErr) throw dErr;

      return NextResponse.json({ ok: true, canvasId });
    }

    // update — ownership check first.
    const { data: owned } = await supabase
      .from("canvas")
      .select("id")
      .eq("id", input.canvas_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json(
        { error: "Playbook not found or no access" },
        { status: 404 }
      );
    }

    const { data: current } = await supabase
      .from("canvas_data")
      .select("version")
      .eq("canvas_id", input.canvas_id)
      .maybeSingle();
    const nextVersion = (current?.version ?? 1) + 1;

    const { error: uErr } = await supabase
      .from("canvas_data")
      .update({
        nodes: input.diagram.nodes,
        edges: input.diagram.edges,
        styles: input.diagram.nodeStyles ?? {},
        version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("canvas_id", input.canvas_id);
    if (uErr) throw uErr;

    // History snapshot of the newly-applied state.
    await supabase.from("canvas_history").insert({
      id: crypto.randomUUID(),
      canvas_id: input.canvas_id,
      data: {
        nodes: input.diagram.nodes,
        edges: input.diagram.edges,
        styles: input.diagram.nodeStyles ?? {},
      },
      version: nextVersion,
    });

    return NextResponse.json({ ok: true, canvasId: input.canvas_id });
  } catch (error: any) {
    console.error("Error applying proposal:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to apply" },
      { status: 500 }
    );
  }
}

/**
 * Reconcile the typed cross-references a document implies (reference cards,
 * @-mentions, live embeds) so backlinks stay accurate after an agent edit. The
 * body is the full document, so we replace this document's doc-level references
 * (from_node IS NULL) wholesale: delete the old set, recreate from the new body.
 * Best-effort — a reference failure must not fail the content apply.
 */
async function reconcileDocumentReferences(
  supabase: any,
  userId: string,
  fromCanvas: string,
  body: any[]
): Promise<void> {
  try {
    const { extractReferences } = await import("@/lib/agent/document-blocks");
    const { createReference } = await import("@/lib/refs/resolver");

    // Replace this document's doc-level references (cards / @-mentions to
    // canvases / live embeds). Phase 5d: do NOT clobber node-level person/role
    // references (to_node set) — those are managed by the editor's onMention /
    // the table-view RACI wiring, not by the document body, so an agent edit
    // must leave them intact.
    await supabase
      .from("reference")
      .delete()
      .eq("user_id", userId)
      .eq("from_canvas", fromCanvas)
      .is("from_node", null)
      .is("to_node", null);

    const seen = new Set<string>();
    for (const spec of extractReferences(body)) {
      if (spec.toCanvas && spec.toCanvas === fromCanvas) continue; // no self-ref
      const key = `${spec.toCanvas ?? ""}|${spec.toCode ?? ""}|${spec.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await createReference(supabase, userId, {
        fromCanvas,
        toCanvas: spec.toCanvas ?? null,
        toCode: spec.toCode ?? null,
        type: spec.type,
      });
    }
  } catch (err) {
    console.error("reconcileDocumentReferences failed:", err);
  }
}
