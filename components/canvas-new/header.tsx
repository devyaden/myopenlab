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
import { Folder } from "@/types/sidebar";
import { CANVAS_TYPE } from "@/types/store";
import { toJpeg, toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import { getUserFeatureLimits, SubscriptionFeatureFlag } from "@/lib/subscription-features";
import { useUser } from "@/lib/contexts/userContext";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  Home,
  Link2,
  Lock,
  Menu,
  Save,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoadingSpinner } from "../loading-spinner";
import { type SaveStatus } from "../editor/SaveStatusIndicator";
import { ImportModal } from "./import-modal";
import { ShareModal } from "./share-modal";
import { BacklinksPanel } from "../refs/BacklinksPanel";
import { MapButton } from "../explore/MapButton";
import { CodeChip } from "@/components/ui/code-chip";
import { StatusChrome } from "../editor-shell/StatusChrome";
import { ViewModeSwitcher } from "./view-mode-switcher";
import { VIEW_MODE, ViewMode } from "./table-view/table.types";

const MAX_TITLE_LENGTH = 50;

interface HeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  onSave: () => void;
  onBackToDashboard: () => void;
  currentState?: any;
  onImportCanvas: (data: any) => void;
  saveLoading: boolean;
  saveStatus?: SaveStatus;
  lastSaved?: Date | null;
  code?: string | null;
  canvasId: string;
  visibility: string;
  onVisibilityChange: (visibility: string) => Promise<void>;
  isOwner: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (viewMode: "canvas" | "table" | "document") => void;
  exportToCSV?: () => void;
  exportToExcel?: () => void;
  exportAsJSON?: () => void;
  propExportAsPDF?: () => void;
  canvasType: CANVAS_TYPE;
  toggleMiniMap?: (show: boolean) => void;
  currentFolder?: Folder | null;
}

export function Header({
  propExportAsPDF,
  projectName,
  setProjectName,
  onSave,
  onBackToDashboard,
  currentState,
  onImportCanvas,
  saveLoading,
  saveStatus,
  lastSaved,
  code,
  canvasId,
  visibility,
  onVisibilityChange,
  isOwner,
  viewMode = VIEW_MODE.canvas,
  onViewModeChange,
  exportToCSV,
  exportToExcel,
  exportAsJSON: propExportAsJSON,
  canvasType,
  toggleMiniMap,
  currentFolder,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLimits, setExportLimits] = useState<any>(null);
  const { user } = useUser();
  const router = useRouter();

  // Load export permissions
  useEffect(() => {
    const loadPermissions = async () => {
      if (user?.id) {
        const limits = await getUserFeatureLimits(user.id);
        setExportLimits(limits);
      }
    };
    loadPermissions();
  }, [user?.id]);

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

  useEffect(() => {}, [viewMode, exportAsJSON, exportAsPDF]);

  return (
    <div className="border-b border-border bg-card py-2">
      <div className="relative flex items-center px-4 ">
        <div className="flex items-center gap-4 ">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* The Locator — breadcrumb-as-coordinates with a "you are here" marker.
              Answers "where am I?" on every editor surface. */}
          <nav
            className="hidden md:flex items-center gap-1.5 text-sm"
            aria-label="Location"
          >
            <div className="mr-1 flex items-center">
              <Image
                width={30}
                height={30}
                src="/assets/global/app-logo.svg"
                alt="Olab"
                className="h-5 w-auto dark:hidden"
              />
              <Image
                width={30}
                height={30}
                src="/assets/global/app-logo-white.svg"
                alt="Olab"
                className="hidden h-5 w-auto dark:block"
              />
            </div>
            <Link
              href="/protected"
              title="Home"
              className="flex items-center rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4 text-faint-ink rtl:rotate-180" />
            <Link
              href={`/protected/folder/${currentFolder?.id || "root"}`}
              className="rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {currentFolder?.name || "Root"}
            </Link>
            <ChevronRight className="h-4 w-4 text-faint-ink rtl:rotate-180" />
            <div className="flex items-center gap-1.5">
              {/* you-are-here marker */}
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention"
                aria-hidden
                title="You are here"
              />
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
                  className={`text-base font-medium bg-transparent border-none outline-none text-foreground focus:ring-0 focus:border-b-2 focus:border-signal ${
                    titleError ? "border-destructive border-b-2" : ""
                  }`}
                  maxLength={MAX_TITLE_LENGTH}
                />
              ) : isOwner ? (
                <span
                  className="text-base font-medium text-foreground cursor-pointer hover:underline"
                  onDoubleClick={handleTitleDoubleClick}
                  title="Double-click to rename"
                >
                  {projectName}
                </span>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-base font-medium text-foreground cursor-default">
                        {projectName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View-only mode: title cannot be edited</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {code && (
                <CodeChip
                  code={code}
                  className="ml-1"
                  title="Operating-model code — stable, unique in your workspace"
                />
              )}
              {titleError && (
                <span className="text-destructive text-xs ml-1">
                  Title too long
                </span>
              )}
            </div>
          </nav>
        </div>

        {/* Surface-switcher — Flow / Table / Document are three views of one
            artifact, in the same place on every editor surface. */}
        {onViewModeChange && canvasType === CANVAS_TYPE.HYBRID && (
          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <ViewModeSwitcher
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              canvasType={canvasType}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 h-10 ">
          {/* The Map — wayfinding entry from the editor chrome (read-only, for everyone). */}
          <MapButton />

          {/* Owner-gated: the cross-reference graph (/api/refs) is scoped to the
              owner's user_id, so a non-owner viewer would only ever see an empty
              panel. (Viewer-visible backlinks would need owner-scoped reads.) */}
          {isOwner && canvasId && (
            <BacklinksPanel canvasId={canvasId} code={code} />
          )}

          {/* StatusChrome — save state + AI budget (owner) + presence (everyone),
              one cohesive cluster shared across all three editor surfaces. */}
          <StatusChrome
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            canvasId={canvasId}
            user={user ? { id: user.id, email: user.email } : null}
            isOwner={isOwner}
            className="mr-1"
          />

          {isOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                title="Save a version snapshot now (changes autosave on their own)"
              >
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
                  className="bg-card hover:bg-accent border border-yadn-accent-green/20 px-3 flex items-center justify-center"
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
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">PNG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={() => exportAsImage("jpeg")}
                  >
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">JPEG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={() => exportAsImage("svg")}
                  >
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">SVG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4 relative"
                    onClick={() => {
                      if (exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]) {
                        toast.error("PDF export is only available for Pro users");
                        router.push("/pricing");
                      } else {
                        exportAsPDF();
                      }
                    }}
                    disabled={exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]}
                  >
                    {exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] && (
                      <Lock className="absolute top-2 right-2 h-4 w-4 text-attention-text" />
                    )}
                    <FileText className={`h-8 w-8 ${exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] ? "text-faint-ink" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] ? "text-faint-ink" : ""}`}>
                      PDF {exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] && "(Pro)"}
                    </span>
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
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4"
                    onClick={handleExportExcel}
                    disabled={!exportToExcel}
                  >
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
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
                    className="flex flex-col items-center justify-center gap-2 h-20 p-4 relative"
                    onClick={() => {
                      if (exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]) {
                        toast.error("PDF export is only available for Pro users");
                        router.push("/pricing");
                      } else {
                        exportAsPDF();
                      }
                    }}
                    disabled={exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF]}
                  >
                    {exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] && (
                      <Lock className="absolute top-2 right-2 h-4 w-4 text-attention-text" />
                    )}
                    <FileText className={`h-8 w-8 ${exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] ? "text-faint-ink" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] ? "text-faint-ink" : ""}`}>
                      PDF {exportLimits && !exportLimits[SubscriptionFeatureFlag.ALLOW_EXPORT_PDF] && "(Pro)"}
                    </span>
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
                  <FileJson className="h-8 w-8 text-muted-foreground" />
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
