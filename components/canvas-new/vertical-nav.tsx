import {
  Code,
  LayoutGrid,
  Wand2,
  MessageCircleQuestionIcon as QuestionMarkCircle,
  Square,
  Database,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface VerticalNavProps {
  className?: string;
}

export function VerticalNav({ className }: VerticalNavProps) {
  return (
    <div
      className={`w-[72px] border-r border-gray-200 flex flex-col items-center py-4 gap-1 ${className}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <LayoutGrid className="h-6 w-6 text-[#344054]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Square className="h-6 w-6 text-[#344054]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Database className="h-6 w-6 text-[#344054]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Code className="h-6 w-6 text-[#344054]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <PenTool className="h-6 w-6 text-[#344054]" />
      </Button>
      <Separator className="my-4" />
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <Wand2 className="h-6 w-6 text-[#344054]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-lg hover:bg-gray-100"
      >
        <LayoutGrid className="h-6 w-6 text-[#344054]" />
      </Button>
      <div className="mt-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-lg hover:bg-gray-100"
        >
          <QuestionMarkCircle className="h-6 w-6 text-[#344054]" />
        </Button>
      </div>
    </div>
  );
}
