import {
  ArrowLeft,
  Bold,
  ChevronDown,
  Copy,
  Italic,
  Lock,
  MessageCircleQuestionIcon as QuestionCircle,
  Underline,
  AlignLeft,
  RotateCcw,
  Frame,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export function Toolbar() {
  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-200">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RotateCcw className="h-4 w-4 rotate-180" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <QuestionCircle className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-3">
              Liberation Sans
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Arial</DropdownMenuItem>
            <DropdownMenuItem>Helvetica</DropdownMenuItem>
            <DropdownMenuItem>Times New Roman</DropdownMenuItem>
            <DropdownMenuItem>Courier New</DropdownMenuItem>
            <DropdownMenuItem>Verdana</DropdownMenuItem>
            <DropdownMenuItem>Georgia</DropdownMenuItem>
            <DropdownMenuItem>Palatino</DropdownMenuItem>
            <DropdownMenuItem>Garamond</DropdownMenuItem>
            <DropdownMenuItem>Bookman</DropdownMenuItem>
            <DropdownMenuItem>Comic Sans MS</DropdownMenuItem>
            <DropdownMenuItem>Trebuchet MS</DropdownMenuItem>
            <DropdownMenuItem>Arial Black</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2">
              10pt
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>8pt</DropdownMenuItem>
            <DropdownMenuItem>9pt</DropdownMenuItem>
            <DropdownMenuItem>10pt</DropdownMenuItem>
            <DropdownMenuItem>11pt</DropdownMenuItem>
            <DropdownMenuItem>12pt</DropdownMenuItem>
            <DropdownMenuItem>14pt</DropdownMenuItem>
            <DropdownMenuItem>16pt</DropdownMenuItem>
            <DropdownMenuItem>18pt</DropdownMenuItem>
            <DropdownMenuItem>20pt</DropdownMenuItem>
            <DropdownMenuItem>24pt</DropdownMenuItem>
            <DropdownMenuItem>30pt</DropdownMenuItem>
            <DropdownMenuItem>36pt</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignLeft className="h-4 w-4" />
        </Button>
      </div>
      <Button className="h-8 w-8 rounded-sm bg-[#8b3dff] hover:bg-[#8b3dff]/90" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Frame className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Copy className="h-4 w-4 rotate-90" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="h-4 w-4 border-2 border-current rounded-sm" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="h-4 w-4 border-2 border-current" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Lock className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="h-4 w-4 border-2 border-current rotate-45" />
        </Button>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              None
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>None</DropdownMenuItem>
            <DropdownMenuItem>Solid</DropdownMenuItem>
            <DropdownMenuItem>Dashed</DropdownMenuItem>
            <DropdownMenuItem>Dotted</DropdownMenuItem>
            <DropdownMenuItem>Double</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" className="px-2">
          3px
        </Button>
      </div>
    </div>
  );
}
