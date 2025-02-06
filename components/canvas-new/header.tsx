import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronLeft,
  Link2,
  Menu,
  Send,
  Video,
  Youtube,
} from "lucide-react";
import Image from "next/image";

export function Header() {
  return (
    <div className="border-b border-gray-200 ">
      <div className="flex items-center px-4 ">
        <div className="flex items-center gap-4 ">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-600 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-6 px-2 text-gray-600 hidden sm:flex"
          >
            <Image
              src="/assets/global/app-icon-small.svg"
              alt="Logo"
              width={30}
              height={30}
            />
            <ChevronDown className="h-3 w-3" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className=" text-xl font-semibold">Flowchart</h1>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 hidden sm:flex items-center justify-center text-center"
                  >
                    <div className="h-2 w-2 bg-yadn-pink rounded-full" />
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

            <nav className="flex items-center gap-4 overflow-x-auto">
              {[
                {
                  name: "File",
                  options: [
                    "New",
                    "Open",
                    "Save",
                    "Save As",
                    "Export",
                    "Close",
                  ],
                },
                {
                  name: "Edit",
                  options: ["Undo", "Redo", "Cut", "Copy", "Paste", "Delete"],
                },
                {
                  name: "Select",
                  options: ["All", "None", "Inverse", "Same Type"],
                },
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
                      className="text-gray-600 p-0 pr-2 h-7 whitespace-nowrap"
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
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 ">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 hidden sm:flex border border-yadn-pink rounded-sm"
          >
            <Youtube className="h-6 w-6 text-yadn-pink" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 hidden sm:flex border border-yadn-pink rounded-sm"
          >
            <Video className="h-6 w-6 text-yadn-pink" />
          </Button>

          <div className="inline-flex rounded-lg overflow-hidden border border-yadn-pink h-10">
            <button className="bg-yadn-pink hover:bg-yadn-pink text-white px-4 py-2  flex items-center gap-2">
              <Send className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
            <button className="bg-white hover:bg-gray-50 border border-yadn-pink/20 px-3  flex items-center justify-center">
              <Link2 className="w-5 h-5 text-yadn-pink" />
            </button>
          </div>

          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
