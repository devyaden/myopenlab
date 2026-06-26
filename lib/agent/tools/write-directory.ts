import { applyDirectoryOps } from "../directory-patch";
import type { AgentToolContext, AgentToolDef } from "../registry";
import { assertOwnership } from "./shared";

/** The ordered column titles for a directory (table) canvas. */
async function readColumnTitles(
  ctx: AgentToolContext,
  canvasId: string
): Promise<string[]> {
  const { data } = await ctx.supabase
    .from("column_definition")
    .select("title, order")
    .eq("canvas_id", canvasId)
    .order("order", { ascending: true });
  const titles = (data ?? []).map((c: any) => String(c.title));
  return titles.length ? titles : ["Name"];
}

async function readDirectoryNodes(
  ctx: AgentToolContext,
  canvasId: string
): Promise<any[]> {
  const { data } = await ctx.supabase
    .from("canvas_data")
    .select("nodes")
    .eq("canvas_id", canvasId)
    .maybeSingle();
  return Array.isArray(data?.nodes) ? (data!.nodes as any[]) : [];
}

export const proposeCreateDirectoryTool: AgentToolDef = {
  name: "propose_create_directory",
  category: "write",
  intent: "create",
  definition: {
    name: "propose_create_directory",
    description:
      "Propose creating a people or role DIRECTORY (a Table of employees or positions that @person/@role mentions and RACI/approver assignments resolve to). This does NOT save — it shows a preview to approve. A 'person' directory gets Name/Email/Role/Manager columns; a 'role' directory gets Name/Description/Reports To. Provide the rows you know via `people`.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the directory (e.g. \"Employee Directory\")" },
        kind: {
          type: "string",
          enum: ["person", "role"],
          description: "person → a roster of employees; role → a roster of positions",
        },
        code: {
          type: "string",
          description: "Optional operating-model code. If omitted the server assigns one.",
        },
        folder_id: { type: "string", description: "Optional folder id to place it in" },
        people: {
          type: "array",
          description:
            "Optional rows. Each: { name (required), email?, role?, manager? } for a person directory, or { name, description?, reportsTo? } for a role directory.",
          items: { type: "object" },
        },
      },
      required: ["name", "kind"],
    },
  },
  handler: async (input) => {
    const kind = input?.kind === "role" ? "role" : "person";
    const people = Array.isArray(input?.people) ? input.people : [];
    return {
      content:
        "Proposal prepared. The user will see a preview and choose whether to apply it. Do not assume it is saved.",
      proposal: {
        kind: "create",
        target: "directory",
        name: input?.name ?? (kind === "role" ? "Roles" : "Directory"),
        code: input?.code ?? null,
        folder_id: input?.folder_id ?? null,
        directory_kind: kind,
        people,
      },
    };
  },
};

export const editDirectoryTool: AgentToolDef = {
  name: "edit_directory",
  category: "edit",
  intent: "edit",
  definition: {
    name: "edit_directory",
    description:
      "Add, update, or remove ROWS in an existing people/role directory, instead of recreating it. Call list_directory with the directory_id first to get each row's id. The user sees a diff to approve; it is re-resolved against the latest directory on apply.",
    input_schema: {
      type: "object",
      properties: {
        canvas_id: { type: "string", description: "The directory (table) id to edit" },
        ops: {
          type: "array",
          description:
            "Ordered row ops. Each op is one of:\n" +
            '- { "op":"add_row", "fields":{ "name":"...", "email":"...", "role":"...", "manager":"..." } } (person) or { "name", "description", "reportsTo" } (role)\n' +
            '- { "op":"update_row", "id":"<rowId>", "fields":{ ... } } (only the given fields change)\n' +
            '- { "op":"delete_row", "id":"<rowId>" }\n' +
            "Row ids come from list_directory. Ops apply in order.",
          items: { type: "object" },
        },
      },
      required: ["canvas_id", "ops"],
    },
  },
  handler: async (input, ctx) => {
    const owned = await assertOwnership(ctx, input?.canvas_id);
    if (!owned)
      return { content: "Directory not found or you don't have access." };
    const ops = Array.isArray(input?.ops) ? input.ops : [];
    if (ops.length === 0) return { content: "No ops provided." };

    const [colTitles, before] = await Promise.all([
      readColumnTitles(ctx, input.canvas_id),
      readDirectoryNodes(ctx, input.canvas_id),
    ]);
    const { nodes: after, errors } = applyDirectoryOps(before, colTitles, ops);

    const errNote = errors.length
      ? ` Note: ${errors.length} op(s) had problems — ${errors.join("; ")}. Re-check row ids from list_directory.`
      : "";
    return {
      content:
        `Patch prepared (${ops.length} op(s)). The user will see a diff and choose whether to apply it; it is re-resolved against the latest directory on apply. Do not assume it is saved.` +
        errNote,
      proposal: {
        kind: "patch",
        target: "directory",
        canvas_id: input.canvas_id,
        ops,
        diff: { before, after },
      },
    };
  },
};
