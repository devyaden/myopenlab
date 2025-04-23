import Editor from "@/components/editor";

const DocumentEditorScreen = ({ params }: any) => {
  return (
    <main className="flex min-h-screen flex-col min-w-full">
      <Editor canvasId={params.id} />
    </main>
  );
};

export default DocumentEditorScreen;
