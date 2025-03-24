"use client";

import { ImportModal } from "@/components/canvas-new/import-modal";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ChevronDown,
  ChevronLeft,
  DownloadCloud,
  FileImage,
  FileJson,
  FileText,
  Link2,
  Menu,
  Save,
  Send,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { usePageManager } from "../../components/PageManager";

const PAGE_SIZES = {
  A4: { name: "A4", width: "210mm", height: "297mm" },
  LETTER: { name: "Letter", width: "215.9mm", height: "279.4mm" },
  LEGAL: { name: "Legal", width: "215.9mm", height: "355.6mm" },
  A3: { name: "A3", width: "297mm", height: "420mm" },
  A5: { name: "A5", width: "148mm", height: "210mm" },
};

const MAX_TITLE_LENGTH = 50;

interface HeaderProps {
  onInsertImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;

  onFitToScreen: () => void;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  onSave: () => void;
  onBackToDashboard: () => void;
  currentState: any;
  onImportCanvas: (data: any) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  saveLoading: boolean;
}

export default function HeaderPlugin({
  onInsertImage,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  projectName,
  setProjectName,
  onSave,
  onBackToDashboard,
  currentState,
  onImportCanvas,
  onBringForward,
  onSendBackward,
  saveLoading,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const { pages, setCurrentPage } = usePageManager();

  // Reference to the container for rendering pages
  const renderContainerRef = useRef(null);

  const handleTitleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle.length > MAX_TITLE_LENGTH) {
      setTitleError(true);
    } else {
      setTitleError(false);
      setProjectName(newTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!titleError) {
        setIsEditing(false);
        toast.success("Title updated successfully");
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTitleError(false);
    }
  };

  const exportAsImage = async (format: "png" | "jpeg" | "svg") => {
    try {
      setExportLoading(true);
      toast.loading(`Exporting as ${format.toUpperCase()}...`);

      if (!pages || pages.length === 0) {
        toast.error("No pages found to export");
        setExportLoading(false);
        return;
      }

      // @ts-ignore
      const currentPageIndex = pages.findIndex((p) => p.isCurrent);

      // Process each page sequentially
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Switch to this page to ensure it's rendered
        setCurrentPage(i);

        // Wait for the page to render
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get the page element
        const pageElement = document.querySelector(".a4-page");

        if (!pageElement) {
          console.error("Could not find page element");
          continue;
        }

        // @ts-ignore
        const canvas = await html2canvas(pageElement, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL(`image/${format}`, 1.0);

        // Create a link for downloading
        const link = document.createElement("a");
        link.href = imgData;
        link.download = `${projectName || "document"}-${i + 1}.${format}`;
        link.click();
      }

      // Restore the original page
      setCurrentPage(currentPageIndex >= 0 ? currentPageIndex : 0);

      toast.dismiss();
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error(`Error exporting ${format.toUpperCase()}:`, error);
      toast.dismiss();
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Update the PDF export function to use the correct page size for each page
  const exportAsPDF = async () => {
    try {
      setExportLoading(true);
      toast.loading("Generating PDF...");

      if (!pages || pages.length === 0) {
        toast.error("No pages found to export");
        setExportLoading(false);
        return;
      }

      debugger;

      // @ts-ignore
      const currentPageIndex = pages.findIndex((p) => p.isCurrent);

      // Create a new PDF document - we'll set the size with the first page
      const firstPageSize = pages[0].pageSize || PAGE_SIZES.A4;

      // Convert mm to points (1mm = 2.83465pt)
      const firstPageWidth = Number.parseFloat(firstPageSize.width) * 2.83465;
      const firstPageHeight = Number.parseFloat(firstPageSize.height) * 2.83465;

      const pdf = new jsPDF({
        orientation:
          firstPageWidth > firstPageHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [firstPageWidth, firstPageHeight],
      });

      // Process each page sequentially
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // If not the first page, add a new page with the correct size
        if (i > 0) {
          const pageSize = page.pageSize || PAGE_SIZES.A4;
          const pageWidth = Number.parseFloat(pageSize.width) * 2.83465;
          const pageHeight = Number.parseFloat(pageSize.height) * 2.83465;

          pdf.addPage(
            [pageWidth, pageHeight],
            pageWidth > pageHeight ? "landscape" : "portrait"
          );
        }

        // Switch to this page to ensure it's rendered
        setCurrentPage(i);

        // Wait for the page to render
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get the page element
        const pageElement = document.querySelector(".a4-page");

        if (!pageElement) {
          console.error("Could not find page element");
          continue;
        }

        // @ts-ignore
        const canvas = await html2canvas(pageElement, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL("image/jpeg", 1.0);

        // Calculate dimensions to fit the page properly
        const pageSize = page.pageSize || PAGE_SIZES.A4;
        const pageWidth = Number.parseFloat(pageSize.width) * 2.83465;
        const pageHeight = Number.parseFloat(pageSize.height) * 2.83465;

        // Add image to PDF - scale to fit the page
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      // Restore the original page
      setCurrentPage(currentPageIndex >= 0 ? currentPageIndex : 0);

      // Save the PDF
      pdf.save(`${projectName || "document"}.pdf`);

      toast.dismiss();
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.dismiss();
      toast.error("Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const exportAsJSON = async () => {
    try {
      setExportLoading(true);
      toast.loading("Preparing JSON export...");

      if (!currentState) {
        toast.dismiss();
        toast.error("No content to export");
        setExportLoading(false);
        return;
      }

      // Extract pages data from page manager if available
      const exportData = {
        projectName,
        pages:
          pages?.map((page) => ({
            pageSize: page.pageSize || PAGE_SIZES.A4,
            content: page.content,
          })) || [],
        state: currentState,
      };

      // Create a formatted JSON string
      const jsonData = JSON.stringify(exportData, null, 2);

      // Create a blob for downloading
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link and trigger it
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName || "document"}.json`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("JSON exported successfully");
    } catch (error) {
      console.error("Error exporting JSON:", error);
      toast.dismiss();
      toast.error("Failed to export JSON");
    } finally {
      setExportLoading(false);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "Export as PDF":
        exportAsPDF();
        break;
      case "Export as PNG":
        exportAsImage("png");
        break;
      case "Export as JPEG":
        exportAsImage("jpeg");
        break;

      case "Export as JSON":
        exportAsJSON();
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
      case "Save":
        onSave();
        break;
      case "Bring Forward":
        onBringForward();
        break;
      case "Send Backward":
        onSendBackward();
        break;
      default:
        // Handle other actions or show a toast for unimplemented features
        toast(`${action} functionality is not implemented yet`);
    }
  };

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
            </div>

            <nav className="flex items-center gap-4 overflow-x-auto">
              {[
                {
                  name: "File",
                  options: [
                    {
                      label: "Save As",
                      submenu: [
                        {
                          label: "Export as PDF",
                          icon: FileText,
                          loading: exportLoading,
                        },
                        {
                          label: "Export as PNG",
                          icon: FileImage,
                          loading: exportLoading,
                        },
                        {
                          label: "Export as JPEG",
                          icon: FileImage,
                          loading: exportLoading,
                        },

                        // {
                        //   label: "Export as JSON",
                        //   icon: FileJson,
                        //   loading: exportLoading,
                        // },
                      ],
                    },
                    "Save",
                  ],
                },
                {
                  name: "Edit",
                  options: ["Undo", "Redo", "Cut", "Copy", "Paste", "Delete"],
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
                                  disabled={subOption.loading}
                                >
                                  {subOption.loading ? (
                                    <LoadingSpinner className="mr-2 h-4 w-4" />
                                  ) : (
                                    <subOption.icon className="mr-2 h-4 w-4" />
                                  )}
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
            {saveLoading ? (
              <LoadingSpinner />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
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

      {/* Hidden container for PDF rendering */}
      <div ref={renderContainerRef} style={{ display: "none" }}></div>
    </div>
  );
}
