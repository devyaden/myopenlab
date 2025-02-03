import {
  ArrowLeft,
  ChevronDown,
  FileLineChartIcon as FlowChart,
  Share2,
  RepeatIcon as Record,
  Play,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <>
      <div className="flex items-center px-4 h-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-yadn-pink rounded flex items-center justify-center">
              <FlowChart className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className=" font-medium">Flowchart</h1>
              <span className="text-sm text-gray-500">•</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-6 px-2 text-gray-600"
                  >
                    Draft
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Draft</DropdownMenuItem>
                  <DropdownMenuItem>In Review</DropdownMenuItem>
                  <DropdownMenuItem>Approved</DropdownMenuItem>
                  <DropdownMenuItem>Published</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Record className="h-4 w-4 text-gray-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Play className="h-4 w-4 text-gray-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Link2 className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            size="sm"
            variant="default"
            className="bg-yadn-pink hover:bg-yadn-pink/90 gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <nav className="flex items-center gap-4 px-4 py-1 border-t border-gray-200">
        {[
          {
            name: "File",
            options: ["New", "Open", "Save", "Save As", "Export", "Close"],
          },
          {
            name: "Edit",
            options: ["Undo", "Redo", "Cut", "Copy", "Paste", "Delete"],
          },
          { name: "Select", options: ["All", "None", "Inverse", "Same Type"] },
          {
            name: "View",
            options: [
              "Zoom In",
              "Zoom Out",
              "Fit to Screen",
              "Show Grid",
              "Show Rulers",
            ],
          },
          {
            name: "Insert",
            options: ["Shape", "Text", "Image", "Frame", "Component"],
          },
          {
            name: "Arrange",
            options: [
              "Bring Forward",
              "Send Backward",
              "Group",
              "Ungroup",
              "Align",
            ],
          },
          {
            name: "Share",
            options: ["Invite to Project", "Share Link", "Export"],
          },
          {
            name: "Help",
            options: [
              "Documentation",
              "Keyboard Shortcuts",
              "Community Forum",
              "Contact Support",
            ],
          },
        ].map((item) => (
          <DropdownMenu key={item.name}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 px-2 h-7"
              >
                {item.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {item.options.map((option) => (
                <DropdownMenuItem key={option}>{option}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </nav>
    </>
  );
}
