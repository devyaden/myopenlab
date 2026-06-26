import type { AgentToolDef } from "./registry";
import {
  listCanvasesTool,
  searchCanvasesTool,
  getCanvasTool,
  getCanvasHistoryTool,
  resolveCodeTool,
  listBacklinksTool,
  generateDiagramTool,
  getDocumentTool,
  listDirectoryTool,
} from "./tools/read";
import {
  proposeCreateCanvasTool,
  proposeUpdateCanvasTool,
  editCanvasTool,
  optimizeCanvasTool,
} from "./tools/write-canvas";
import {
  proposeCreateDocumentTool,
  proposeUpdateDocumentTool,
  proposeProcessPageTool,
  editDocumentBlocksTool,
} from "./tools/write-document";
import {
  proposeCreateDirectoryTool,
  editDirectoryTool,
} from "./tools/write-directory";
import { linkArtifactsTool } from "./tools/link";

// IMPORTANT: keep this in the SAME order the model has always seen — the tool
// list is part of the prompt-cached request prefix, so reordering busts the
// cache. (read group, then canvas writes, get_document, doc writes, list_directory,
// directory write — matching the pre-registry AGENT_TOOLS array exactly.)
export const AGENT_TOOL_REGISTRY: AgentToolDef[] = [
  listCanvasesTool,
  searchCanvasesTool,
  getCanvasTool,
  getCanvasHistoryTool,
  resolveCodeTool,
  listBacklinksTool,
  generateDiagramTool,
  proposeCreateCanvasTool,
  proposeUpdateCanvasTool,
  getDocumentTool,
  proposeCreateDocumentTool,
  proposeUpdateDocumentTool,
  proposeProcessPageTool,
  listDirectoryTool,
  proposeCreateDirectoryTool,
  // Phase D: fine-grained edit / link / optimize tools. Appended AFTER the original
  // set so the existing tools keep their positions; the model gains these without
  // the macro tools moving. (Adding tools busts the prompt cache once — expected.)
  editCanvasTool,
  editDocumentBlocksTool,
  editDirectoryTool,
  linkArtifactsTool,
  optimizeCanvasTool,
];
