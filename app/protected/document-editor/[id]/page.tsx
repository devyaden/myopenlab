import DocumentEditor from "@/components/document-editor";

const DocumentEditorScreen = ({ params }: { params: { id: string } }) => {
  return <DocumentEditor canvasId={params.id} />;
};

export default DocumentEditorScreen;
