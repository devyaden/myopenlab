import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Blocks,
  Database,
  Image,
  Menu,
  PanelsTopLeft,
  Printer,
  Rocket,
  Shapes,
  WandSparkles,
} from "lucide-react";

interface VerticalNavProps {
  className?: string;
  onToggleSidebar: () => void;
}

export function VerticalNav({ className, onToggleSidebar }: VerticalNavProps) {
  return (
    <div
      className={`w-[72px] border-r border-gray-200 flex flex-col items-center py-4 gap-2 ${className} z-30 bg-white`}
    >
      {/* <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100 mb-2"
        onClick={onToggleSidebar}
      >
        <Menu className="!h-6 !w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <PanelsTopLeft className="!h-6 !w-6" />
      </Button> */}
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100 border-yadn-pink"
        onClick={onToggleSidebar}
      >
        <Shapes className="!h-6 !w-6 text-yadn-pink" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Printer className="!h-6 !w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Image className="!h-6 !w-6" />
      </Button>
    </div>
  );
}
