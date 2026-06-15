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
    target: z.enum(["canvas", "document"]).optional(),
    name: z.string().min(1).max(120),
    code: z.string().max(40).nullable().optional(),
    folder_id: z.string().uuid().nullable().optional(),
    diagram: diagram.optional(),
    body: docBody.optional(),
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
      return NextResponse.json({ ok: true, canvasId: input.canvas_id });
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

    await supabase
      .from("reference")
      .delete()
      .eq("user_id", userId)
      .eq("from_canvas", fromCanvas)
      .is("from_node", null);

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
