// The three editor surfaces are all `canvas` rows distinguished by canvas_type,
// but they live on two routes: documents render at /protected/document-editor/[id]
// (the dedicated DocumentEditor), while flow/table canvases render at
// /protected/playbook/[id] (CanvasNew). Navigating a document to the playbook
// route shows the wrong surface, so always route by type.
export function playbookHref(
  id: string,
  canvasType?: string | null
): string {
  return (canvasType ?? "").toLowerCase() === "document"
    ? `/protected/document-editor/${id}`
    : `/protected/playbook/${id}`;
}
