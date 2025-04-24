import Editor from "@/components/editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DocumentEditorScreen = async ({ params }: PageProps) => {
  const { id } = await params;
  return (
    <main className="flex min-h-screen flex-col min-w-full">
      <Editor canvasId={id} />
    </main>
  );
};

export default DocumentEditorScreen;
