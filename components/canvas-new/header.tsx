"use client";

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
  RotateCcw,
  Save,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import type React from "react";

const MAX_TITLE_LENGTH = 50;

interface HeaderProps {
  onInsertImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  onSave: () => void;
  onRestore: () => void;
  onBackToDashboard: () => void;
}

export function Header({
  onInsertImage,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleGrid,
  onToggleRulers,
  projectName,
  setProjectName,
  onSave,
  onRestore,
  onBackToDashboard,
}: HeaderProps) {
  const [documentStatus, setDocumentStatus] = useState("Draft");
  const [isEditing, setIsEditing] = useState(false);
  const [titleError, setTitleError] = useState(false);

  const handleTitleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setProjectName(newTitle);
    setTitleError(newTitle.length > MAX_TITLE_LENGTH);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (projectName.length <= MAX_TITLE_LENGTH) {
        setIsEditing(false);
        setProjectName(projectName);
        toast.success("Title updated successfully!");
      } else {
        toast.error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setProjectName("Untitled Project");
      setTitleError(false);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "New":
        // Implement new document creation logic
        console.log("Creating new document");
        break;
      case "Open":
        // Implement open document logic
        console.log("Opening document");
        break;
      case "Save":
        onSave();
        break;
      case "Save As":
        // Implement save as logic
        console.log("Saving document as");
        break;
      case "Export":
        // Implement export logic
        console.log("Exporting document");
        break;
      case "Close":
        // Implement close document logic
        console.log("Closing document");
        break;
      case "Undo":
        onUndo();
        break;
      case "Redo":
        onRedo();
        break;
      case "Cut":
        onCut();
        break;
      case "Copy":
        onCopy();
        break;
      case "Paste":
        onPaste();
        break;
      case "Delete":
        onDelete();
        break;
      case "Select All":
        // Implement select all logic
        console.log("Selecting all");
        break;
      case "Select None":
        // Implement select none logic
        console.log("Deselecting all");
        break;
      case "Inverse Selection":
        // Implement inverse selection logic
        console.log("Inverting selection");
        break;
      case "Same Type":
        // Implement select same type logic
        console.log("Selecting same type");
        break;
      case "Zoom In":
        onZoomIn();
        break;
      case "Zoom Out":
        onZoomOut();
        break;
      case "Fit to Screen":
        onFitToScreen();
        break;
      case "Show Grid":
        onToggleGrid();
        break;
      case "Show Rulers":
        onToggleRulers();
        break;
      case "Shape":
        // Implement insert shape logic
        console.log("Inserting shape");
        break;
      case "Text":
        // Implement insert text logic
        console.log("Inserting text");
        break;
      case "Image":
        onInsertImage();
        break;
      case "Frame":
        // Implement insert frame logic
        console.log("Inserting frame");
        break;
      case "Component":
        // Implement insert component logic
        console.log("Inserting component");
        break;
      case "Bring Forward":
        // Implement bring forward logic
        console.log("Bringing forward");
        break;
      case "Send Backward":
        // Implement send backward logic
        console.log("Sending backward");
        break;
      case "Group":
        // Implement group logic
        console.log("Grouping elements");
        break;
      case "Ungroup":
        // Implement ungroup logic
        console.log("Ungrouping elements");
        break;
      case "Align":
        // Implement align logic
        console.log("Aligning elements");
        break;
      case "Invite to Project":
        // Implement invite to project logic
        console.log("Inviting to project");
        break;
      case "Share Link":
        // Implement share link logic
        console.log("Sharing link");
        break;
      case "Documentation":
        // Open documentation in a new tab
        window.open("https://example.com/docs", "_blank");
        break;
      case "Keyboard Shortcuts":
        // Show keyboard shortcuts modal
        console.log("Showing keyboard shortcuts");
        break;
      case "Community Forum":
        // Open community forum in a new tab
        window.open("https://example.com/forum", "_blank");
        break;
      case "Contact Support":
        // Open support contact form
        console.log("Opening support contact form");
        break;
      default:
        console.log(`Action not implemented: ${action}`);
    }
  };

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
            onClick={onBackToDashboard}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
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
              {isEditing ? (
                <input
                  type="text"
                  value={projectName}
                  onChange={handleTitleChange}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={() => {
                    setIsEditing(false);
                    setTitleError(false);
                  }}
                  autoFocus
                  className={`text-xl font-semibold bg-transparent border-none outline-none ${
                    titleError ? "border-red-500 border-b-2" : ""
                  }`}
                  maxLength={MAX_TITLE_LENGTH}
                />
              ) : (
                <h1
                  className="text-xl font-semibold cursor-pointer"
                  onDoubleClick={handleTitleDoubleClick}
                >
                  {projectName}
                </h1>
              )}
              {titleError && (
                <span className="text-red-500 text-xs">Title too long</span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 hidden sm:flex items-center justify-center text-center"
                  >
                    <div className="h-2 w-2 bg-yadn-pink rounded-full" />
                    {documentStatus}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setDocumentStatus("Draft")}>
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDocumentStatus("In Review")}
                  >
                    In Review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDocumentStatus("Approved")}
                  >
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDocumentStatus("Published")}
                  >
                    Published
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <nav className="flex items-center gap-4 overflow-x-auto">
              {[
                {
                  name: "File",
                  options: ["New", "Open", "Save", "Save As"],
                },
                {
                  name: "Edit",
                  options: ["Undo", "Redo", "Cut", "Copy", "Paste", "Delete"],
                },
                {
                  name: "Select",
                  options: [
                    "Select All",
                    "Select None",
                    "Inverse Selection",
                    "Same Type",
                  ],
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
                  options: ["Invite to Project", "Share Link"],
                },
                {
                  name: "Help",
                  options: [
                    "Documentation",
                    "Keyboard Shortcuts",
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
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => handleMenuAction(option)}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </nav>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 ">
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onRestore}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore
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
