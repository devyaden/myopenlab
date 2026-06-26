// Maps a tool name to a friendly, translatable activity label key (agent.tools.*)
// for the chat's "Using …" streaming indicator. Single source so the chat and the
// dev viewer stay in sync. Unknown tools fall back to a generic "working" label.

export function toolLabelKey(name: string): string {
  switch (name) {
    case "list_canvases":
    case "get_canvas_history":
    case "resolve_code":
    case "list_backlinks":
    case "list_directory":
      return "agent.tools.reading";
    case "search_canvases":
      return "agent.tools.searching";
    case "get_canvas":
      return "agent.tools.readingPlaybook";
    case "get_document":
      return "agent.tools.readingDocument";
    case "generate_diagram":
    case "propose_create_canvas":
    case "propose_update_canvas":
    case "propose_create_document":
    case "propose_update_document":
    case "propose_process_page":
    case "propose_create_directory":
      return "agent.tools.drafting";
    case "edit_canvas":
      return "agent.tools.editingFlow";
    case "edit_document_blocks":
      return "agent.tools.editingDocument";
    case "edit_directory":
      return "agent.tools.editingDirectory";
    case "link_artifacts":
      return "agent.tools.linking";
    case "optimize_canvas":
      return "agent.tools.optimizing";
    default:
      return "agent.tools.working";
  }
}
