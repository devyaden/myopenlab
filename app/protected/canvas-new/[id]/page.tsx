import CanvasNew from "@/components/canvas-new";

const Canvas = ({ params }: { params: { id: string } }) => (
  <CanvasNew canvasId={params.id} />
);

export default Canvas;
