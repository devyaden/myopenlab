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
  FileImage,
  FileText,
  FileJson,
  Download,
  DownloadCloud,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import type React from "react";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import { ImportModal } from "./import-modal";
import { Dialog } from "../ui/dialog";

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
  currentState: any;
  onImportCanvas: (data: any) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
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
  currentState,
  onImportCanvas,
  onBringForward,
  onSendBackward,
}: HeaderProps) {
  const [documentStatus, setDocumentStatus] = useState("Draft");
  const [isEditing, setIsEditing] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const exportAsImage = async (format: "png" | "jpeg" | "svg") => {
    try {
      const element = document.querySelector(".react-flow") as HTMLElement;
      if (!element) {
        toast.error("No diagram found to export");
        return;
      }

      let dataUrl;
      switch (format) {
        case "png":
          dataUrl = await toPng(element, {
            quality: 1,
            backgroundColor: "#ffffff",
          });
          break;
        case "jpeg":
          dataUrl = await toJpeg(element, {
            quality: 0.95,
            backgroundColor: "#ffffff",
          });
          break;
        case "svg":
          dataUrl = await toSvg(element, { backgroundColor: "#ffffff" });
          break;
      }

      // Create a download link
      const link = document.createElement("a");
      link.download = `${projectName}.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
    }
  };

  const exportAsPDF = async () => {
    try {
      const element = document.querySelector(".react-flow") as HTMLElement;
      if (!element) {
        toast.error("No diagram found to export");
        return;
      }

      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [element.clientWidth, element.clientHeight],
      });

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        element.clientWidth,
        element.clientHeight
      );
      pdf.save(`${projectName}.pdf`);

      toast.success("Exported as PDF");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("PDF export failed");
    }
  };

  const exportAsJSON = () => {
    try {
      const dataStr = JSON.stringify(currentState, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const link = document.createElement("a");
      link.download = `${projectName}.json`;
      link.href = dataUri;
      link.click();

      toast.success("Exported as JSON");
    } catch (error) {
      console.error("JSON export failed:", error);
      toast.error("JSON export failed");
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "Export as PNG":
        exportAsImage("png");
        break;
      case "Export as JPEG":
        exportAsImage("jpeg");
        break;
      case "Export as SVG":
        exportAsImage("svg");
        break;
      case "Export as PDF":
        exportAsPDF();
        break;
      case "Export as JSON":
        exportAsJSON();
        break;
      case "New":
        // Implement new document creation logic
        console.log("Creating new document");
        break;
      case "Open":
        setIsImportModalOpen(true);
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
        onBringForward();
        break;
      case "Send Backward":
        onSendBackward();
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
                  options: [
                    "New",
                    "Open",
                    "Save",

                    {
                      label: "Save As",
                      submenu: [
                        { label: "Export as PNG", icon: FileImage },
                        { label: "Export as JPEG", icon: FileImage },
                        { label: "Export as SVG", icon: FileImage },
                        { label: "Export as PDF", icon: FileText },
                        { label: "Export as JSON", icon: FileJson },
                      ],
                    },
                  ],
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
                    {item.options.map((option: any) => {
                      if (typeof option === "object" && option.submenu) {
                        return (
                          <DropdownMenu key={option.label}>
                            <DropdownMenuTrigger className="w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-default flex items-center">
                              <DownloadCloud className="mr-2 h-4 w-4" />
                              {option.label}
                              <ChevronDown className="ml-auto h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start">
                              {option.submenu.map((subOption: any) => (
                                <DropdownMenuItem
                                  key={subOption.label}
                                  onSelect={() =>
                                    handleMenuAction(subOption.label)
                                  }
                                >
                                  <subOption.icon className="mr-2 h-4 w-4" />
                                  {subOption.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      }
                      return (
                        <DropdownMenuItem
                          key={
                            typeof option === "string" ? option : option.label
                          }
                          onSelect={() => handleMenuAction(option as string)}
                        >
                          {option}
                        </DropdownMenuItem>
                      );
                    })}
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
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onImportCanvas}
      />
    </div>
  );
}
