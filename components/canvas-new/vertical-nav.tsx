import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Blocks,
  CodeXml,
  Database,
  Image,
  PanelsTopLeft,
  Printer,
  Rocket,
  Shapes,
  Sparkle,
  WandSparkles,
} from "lucide-react";

interface VerticalNavProps {
  className?: string;
}

export function VerticalNav({ className }: VerticalNavProps) {
  return (
    <div
      className={`w-[72px] border-r border-gray-200 flex flex-col items-center py-4 gap-2 ${className}`}
    >
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <PanelsTopLeft className="!h-6 !w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Blocks className="!h-6 !w-6" />
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
        <Shapes className="!h-6 !w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Image className="!h-6 !w-6" />
      </Button>
      <Separator className="my-4" />
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <WandSparkles className="!h-6 !w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Database className="!h-6 !w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Rocket className="!h-6 !w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Sparkle className="!h-6 !w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <CodeXml className="!h-6 !w-6" />
      </Button>
    </div>
  );
}
