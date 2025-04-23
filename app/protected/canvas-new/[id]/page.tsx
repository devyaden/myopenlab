import CanvasNew from "@/components/canvas-new";
import { Metadata } from "next";

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Canvas({ params }: any) {
  return <CanvasNew canvasId={params.id} />;
}
