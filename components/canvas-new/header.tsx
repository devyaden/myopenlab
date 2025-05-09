"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toJpeg, toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  ChevronLeft,
  Download,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  Link2,
  Menu,
  Save,
  Send,
  ChevronRight,
  Home,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../loading-spinner";
import { ImportModal } from "./import-modal";
import { ShareModal } from "./share-modal";
import { VIEW_MODE, ViewMode } from "./table-view/table.types";
import Image from "next/image";
import { CANVAS_TYPE } from "@/types/store";
import Link from "next/link";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { Folder } from "@/types/sidebar";

const MAX_TITLE_LENGTH = 50;

interface HeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  onSave: () => void;
  onBackToDashboard: () => void;
  currentState?: any;
  onImportCanvas: (data: any) => void;

  saveLoading: boolean;
  canvasId: string;
  visibility: string;
  onVisibilityChange: (visibility: string) => Promise<void>;
  isOwner: boolean;
  viewMode?: ViewMode;
  exportToCSV?: () => void;
  exportToExcel?: () => void;
  exportAsJSON?: () => void;
  exportAsPDF?: () => void;
  canvasType: CANVAS_TYPE;
  toggleMiniMap?: (show: boolean) => void;
  currentFolder?: Folder | null;
}

export function Header({
  projectName,
  setProjectName,
  onSave,
  onBackToDashboard,
  currentState,
  onImportCanvas,
  saveLoading,
  canvasId,
  visibility,
  onVisibilityChange,
  isOwner,
  viewMode = VIEW_MODE.canvas,
  exportToCSV,
  exportToExcel,
  exportAsJSON: propExportAsJSON,
  exportAsPDF: propExportAsPDF,
  canvasType,
  toggleMiniMap,
  currentFolder,
}: HeaderProps) {
  const [documentStatus, setDocumentStatus] = useState("Draft");
  const [isEditing, setIsEditing] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { folders } = useSidebarStore();

  const handleTitleDoubleClick = () => {
    if (!isOwner) return;
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

      // Hide miniMap for export
      toggleMiniMap?.(false);

      // Add a small delay to ensure the UI updates before capturing
      await new Promise((resolve) => setTimeout(resolve, 100));

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

      // Show miniMap again after export
      toggleMiniMap?.(true);

      toast.success(`Exported as ${format.toUpperCase()}`);
      setIsExportModalOpen(false);
    } catch (error) {
      // Make sure to restore miniMap if there's an error
      toggleMiniMap?.(true);
      console.error("Export failed:", error);
      toast.error("Export failed");
    }
  };

  const exportAsPDF = async () => {
    if (propExportAsPDF) {
      propExportAsPDF();
      return;
    }
    try {
      const element = document.querySelector(".react-flow") as HTMLElement;
      if (!element) {
        toast.error("No diagram found to export");
        return;
      }

      // Hide miniMap for export
      toggleMiniMap?.(false);

      // Add a small delay to ensure the UI updates before capturing
      await new Promise((resolve) => setTimeout(resolve, 100));

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

      // Show miniMap again after export
      toggleMiniMap?.(true);

      toast.success("Exported as PDF");
      setIsExportModalOpen(false);
    } catch (error) {
      // Make sure to restore miniMap if there's an error
      toggleMiniMap?.(true);
      console.error("PDF export failed:", error);
      toast.error("PDF export failed");
    }
  };

  const exportAsJSON = () => {
    if (propExportAsJSON) {
      propExportAsJSON();
      return;
    }
    try {
      const dataStr = JSON.stringify(currentState, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const link = document.createElement("a");
      link.download = `${projectName}.json`;
      link.href = dataUri;
      link.click();

      toast.success("Exported as JSON");
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("JSON export failed:", error);
      toast.error("JSON export failed");
    }
  };

  const handleExportCSV = () => {
    if (exportToCSV) {
      exportToCSV();
      toast.success("Exported as CSV");
      setIsExportModalOpen(false);
    }
  };

  const handleExportExcel = () => {
    if (exportToExcel) {
      exportToExcel();
      toast.success("Exported as Excel");
      setIsExportModalOpen(false);
    }
  };

  const handleShareDialogOpen = () => {
    setIsShareModalOpen(true);
  };

  const handleExportDialogOpen = () => {
    setIsExportModalOpen(true);
  };

  // useEffect(() => {
  //   return () => {
  //     onSave();
  //   };
  // }, []);

  return (
    <div className="border-b border-gray-200 py-2 ">
      <div className="flex items-center px-4 ">
        <div className="flex items-center gap-4 ">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-600 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Breadcrumbs navigation */}
          <nav className="hidden md:flex items-center">
            <Link
              href="/protected"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Home className="h-4 w-4 mr-1" />
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <Link
              href={`/protected/folder/${currentFolder?.id || "root"}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {currentFolder?.name || "Root"}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {projectName}
            </span>
          </nav>

          {/* Cionay Logo */}
          <div className="flex items-center">
            <Image
              width={32}
              height={32}
              src="/assets/global/app-logo.svg"
              alt="Cionay Logo"
              className="h-6 w-auto"
            />
          </div>

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
                  className={`text-2xl font-semibold bg-transparent border-none outline-none ${
                    titleError ? "border-red-500 border-b-2" : ""
                  }`}
                  maxLength={MAX_TITLE_LENGTH}
                />
              ) : isOwner ? (
                <h1
                  className="text-2xl font-semibold cursor-pointer"
                  onDoubleClick={handleTitleDoubleClick}
                >
                  {projectName}
                </h1>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <h1 className="text-2xl font-semibold cursor-default">
                        {projectName}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View-only mode: Title cannot be edited</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {titleError && (
                <span className="text-red-500 text-xs">Title too long</span>
              )}

              {/* Uncomment this if document status functionality is needed
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 hidden sm:flex items-center justify-center text-center"
                    disabled={!isOwner}
                  >
                    <div className="h-2 w-2 bg-yadn-accent-green rounded-full" />
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
              */}
            </div>

            {/* <nav className="flex items-center gap-4 overflow-x-auto">
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
                      disabled={!isOwner && item.name !== "Help"}
                    >
                      {item.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {item.options.map((option: any) => {
                      if (typeof option === "object" && option.submenu) {
                        return (
                          <DropdownMenu key={option.label}>
                            <DropdownMenuTrigger
                              asChild
                              className="w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-default flex items-center"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full flex items-center"
                                disabled={!isOwner}
                              >
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                {option.label}
                                <ChevronDown className="ml-auto h-4 w-4" />
                              </Button>
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
            </nav> */}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 h-10 ">
          {isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={onSave}>
                {saveLoading ? (
                  <LoadingSpinner />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDialogOpen}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>

              <div className="inline-flex rounded-lg overflow-hidden border border-yadn-accent-green h-9">
                <button
                  className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white px-4 py-2 flex items-center gap-2"
                  onClick={handleShareDialogOpen}
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </button>
                <button
                  className="bg-white hover:bg-gray-50 border border-yadn-accent-green/20 px-3 flex items-center justify-center"
                  onClick={handleShareDialogOpen}
                >
                  <Link2 className="w-5 h-5 text-yadn-accent-green" />
                </button>
              </div>
            </>
          )}

          {/* <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar> */}
        </div>
      </div>
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onImportCanvas}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        canvasId={canvasId}
        canvasName={projectName}
        visibility={visibility}
        onVisibilityChange={onVisibilityChange}
        canvasType={canvasType}
      />

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Canvas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {viewMode === VIEW_MODE.canvas && (
              <div className="grid grid-cols-1 gap-4">
                <h3 className="text-sm font-medium">Canvas Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={() => exportAsImage("png")}
                  >
                    <FileImage className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">PNG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={() => exportAsImage("jpeg")}
                  >
                    <FileImage className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">JPEG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={() => exportAsImage("svg")}
                  >
                    <FileImage className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">SVG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={exportAsPDF}
                  >
                    <FileText className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">PDF</span>
                  </Button>
                </div>
              </div>
            )}

            {viewMode === VIEW_MODE.table && (
              <div className="grid grid-cols-1 gap-4">
                <h3 className="text-sm font-medium">Table Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={handleExportCSV}
                    disabled={!exportToCSV}
                  >
                    <FileSpreadsheet className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={handleExportExcel}
                    disabled={!exportToExcel}
                  >
                    <FileSpreadsheet className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">Excel</span>
                  </Button>
                </div>
              </div>
            )}

            {viewMode === VIEW_MODE.document && (
              <div className="grid grid-cols-1 gap-4">
                <h3 className="text-sm font-medium">Document Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={exportAsPDF}
                  >
                    <FileText className="h-8 w-8 text-gray-600" />
                    <span className="text-sm">PDF</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <h3 className="text-sm font-medium">Other Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                  onClick={exportAsJSON}
                >
                  <FileJson className="h-8 w-8 text-gray-600" />
                  <span className="text-sm">JSON</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
