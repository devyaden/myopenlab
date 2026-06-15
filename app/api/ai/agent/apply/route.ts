import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Commits an agent proposal the user approved in the preview.
// create → new playbook (+ canvas_data). update → overwrite canvas_data and
// write a canvas_history snapshot (so the agent's edits get undo/history).
const diagram = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  nodeStyles: z.record(z.any()).optional(),
});

const applySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create"),
    name: z.string().min(1).max(80),
    code: z.string().max(40).nullable().optional(),
    folder_id: z.string().uuid().nullable().optional(),
    diagram,
  }),
  z.object({
    kind: z.literal("update"),
    canvas_id: z.string().uuid(),
    diagram,
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
