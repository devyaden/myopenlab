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
  DownloadCloud,
  FileIcon as FilePdf,
  FileJson,
  Link2,
  Menu,
  Save,
  Send,
  Undo,
  Redo,
  Copy,
  Scissors,
  FilePlus,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
  Users,
  BookOpen,
  Keyboard,
  FileDown,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useState, useRef } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ImportModal } from "./ImportModal";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const MAX_TITLE_LENGTH = 50;

interface HeaderProps {
  onInsertImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  onSave: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onBackToDashboard: () => void;
  onImportCanvas: (data: any) => void;
  saveLoading: boolean;
  isExporting: boolean;
  wordCount: number;
  characterCount: number;
}

export function Header({
  onInsertImage,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleGrid,
  onToggleRulers,
  projectName,
  setProjectName,
  onSave,
  onExportPDF,
  onExportJSON,
  onBackToDashboard,
  onImportCanvas,
  saveLoading,
  isExporting,
  wordCount,
  characterCount,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const shareLinkRef = useRef<HTMLInputElement>(null);

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
      } else {
        toast.error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setProjectName("Untitled Project");
      setTitleError(false);
    }
  };

  const handleShareDialogOpen = () => {
    setIsShareDialogOpen(true);
    // Generate a fake share link based on the document title
    setShareLink(
      `https://editor.example.com/share/${projectName.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 8)}`
    );
  };

  const handleCopyShareLink = () => {
    if (shareLinkRef.current) {
      shareLinkRef.current.select();
      document.execCommand("copy");
      toast.success("Link copied to clipboard");
    }
  };

  const handleShareByEmail = () => {
    if (!shareEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(shareEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Simulate sharing by email
    toast.success(`Invitation sent to ${shareEmail}`);
    setShareEmail("");
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "Export as PDF":
        onExportPDF();
        break;
      case "Export as JSON":
        onExportJSON();
        break;
      case "New":
        if (
          confirm("Create a new document? Any unsaved changes will be lost.")
        ) {
          window.location.reload();
        }
        break;
      case "Open":
        setIsImportModalOpen(true);
        break;
      case "Save":
        onSave();
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
        onSelectAll();
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
      case "Image":
        onInsertImage();
        break;
      case "Invite to Project":
        handleShareDialogOpen();
        break;
      case "Share Link":
        handleShareDialogOpen();
        break;
      case "Documentation":
        window.open("https://tiptap.dev/docs", "_blank");
        break;
      case "Keyboard Shortcuts":
        toast("Keyboard shortcuts functionality not implemented yet");
        break;
      case "Community Forum":
        window.open(
          "https://github.com/ueberdosis/tiptap/discussions",
          "_blank"
        );
        break;
      case "Contact Support":
        toast("Contact support functionality not implemented yet");
        break;
      default:
        toast(`Action not implemented: ${action}`);
    }
  };

  useEffect(() => {
    return () => {
      onSave();
    };
  }, []);

  return (
    <div className="border-b border-gray-200 py-2 sticky top-0 z-30 bg-white">
      <div className="flex items-center px-2 md:px-4">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="py-4">
                <h2 className="text-lg font-semibold mb-4">Menu</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">File</h3>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("New")}
                      >
                        <FilePlus className="h-4 w-4 mr-2" />
                        New
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Open")}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Save")}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Export as PDF")}
                      >
                        <FilePdf className="h-4 w-4 mr-2" />
                        Export as PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Export as JSON")}
                      >
                        <FileJson className="h-4 w-4 mr-2" />
                        Export as JSON
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Edit</h3>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Undo")}
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Undo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Redo")}
                      >
                        <Redo className="h-4 w-4 mr-2" />
                        Redo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Cut")}
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Cut
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Copy")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Paste")}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Paste
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">View</h3>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Zoom In")}
                      >
                        <ZoomIn className="h-4 w-4 mr-2" />
                        Zoom In
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Zoom Out")}
                      >
                        <ZoomOut className="h-4 w-4 mr-2" />
                        Zoom Out
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Fit to Screen")}
                      >
                        <Maximize className="h-4 w-4 mr-2" />
                        Fit to Screen
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Share</h3>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Share Link")}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Share Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Invite to Project")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Invite to Project
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Help</h3>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Documentation")}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuAction("Keyboard Shortcuts")}
                      >
                        <Keyboard className="h-4 w-4 mr-2" />
                        Keyboard Shortcuts
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center justify-center"
            onClick={onBackToDashboard}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          {/* 
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-6 px-2 text-gray-600 hidden sm:flex"
          >
            <Image
              src="/placeholder.svg?height=30&width=30"
              alt="Logo"
              width={30}
              height={30}
            />
            <ChevronDown className="h-3 w-3" />
          </Button> */}

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
            </div>

            <nav className="hidden md:flex items-center gap-4 overflow-x-auto">
              {[
                {
                  name: "File",
                  options: [
                    "New",
                    "Open",
                    "Save",
                    {
                      label: "Export",
                      submenu: [
                        { label: "Export as PDF", icon: FilePdf },
                        { label: "Export as JSON", icon: FileJson },
                      ],
                    },
                  ],
                },
                {
                  name: "Edit",
                  options: [
                    "Undo",
                    "Redo",
                    "Cut",
                    "Copy",
                    "Paste",
                    "Delete",
                    "Select All",
                  ],
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
                  options: [
                    "Image",
                    "Table",
                    "Link",
                    "Horizontal Rule",
                    "Page Break",
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

        <div className="ml-auto flex items-center gap-2">
          {/* Word count badge - visible on larger screens */}
          <Badge
            variant="outline"
            className="hidden md:flex gap-1 items-center"
          >
            <span className="text-xs">{wordCount} words</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs">{characterCount} characters</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={saveLoading}
          >
            {saveLoading ? (
              <LoadingSpinner />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={isExporting}
            className="hidden sm:flex"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FilePdf className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>

          <div className="inline-flex rounded-lg overflow-hidden border border-yadn-accent-green h-8 sm:h-10">
            <button
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1 sm:gap-2"
              onClick={handleShareDialogOpen}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium hidden sm:inline">Share</span>
            </button>
            <button
              className="bg-white hover:bg-gray-50 border border-yadn-accent-green/20 px-2 sm:px-3 flex items-center justify-center"
              onClick={handleCopyShareLink}
            >
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-yadn-accent-green" />
            </button>
          </div>

          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onImportCanvas}
      />

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="share-link"
                  ref={shareLinkRef}
                  value={shareLink}
                  readOnly
                  className="flex-1"
                />
                <Button size="sm" onClick={handleCopyShareLink}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-email">Invite by Email</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="share-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleShareByEmail}>
                  Send
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShareDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
