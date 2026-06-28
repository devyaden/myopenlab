"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ANCHORS } from "@/components/onboarding/onboarding-steps";
import { cn, generateUntitledName } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Wand2,
  Crown,
  LayoutTemplate,
  Users,
  GitBranch,
  Table as TableIcon,
  Loader2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { AIGenerationDialog } from "../canvas-new/ai-generation-dialog";
import { InputWithIcon } from "../input-with-icon";
import { buildProcessPageBlocks } from "@/lib/agent/process-page-template";

export enum CANVAS_TYPE {
  HYBRID = "hybrid",
  TABLE = "table",
  DOCUMENT = "document",
}

interface CreateNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
  onCreateCanvas: (
    name: string,
    description: string,
    type: CANVAS_TYPE,
    folderId: string | null
  ) => boolean;
  folders: {
    id: string;
    name: string;
    canvases: { id: string; name: string }[];
  }[];
  type: "folder" | "canvas" | null;
  currentFolderId?: string | null;
  rootCanvases?: { id: string; name: string }[];
  canUseAI?: () => boolean;
  onAILimitReached?: () => void;
  canCreateCanvas?: (type?: CANVAS_TYPE) => boolean;
  onCanvasLimitReached?: () => void;
}

const folderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(50, "Folder name must be 50 characters or less"),
});

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Playbook name is required")
    .max(50, "Playbook name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  folderId: z.string().nullable(),
  canvas_type: z
    .enum([CANVAS_TYPE.HYBRID, CANVAS_TYPE.TABLE, CANVAS_TYPE.DOCUMENT])
    .default(CANVAS_TYPE.HYBRID),
});

type FolderFormValues = z.infer<typeof folderSchema>;
type CanvasFormValues = z.infer<typeof formSchema>;

export function CreateNewModal({
  isOpen,
  onClose,
  onCreateFolder,
  onCreateCanvas,
  folders,
  type,
  currentFolderId,
  rootCanvases,
  canUseAI,
  onAILimitReached,
  canCreateCanvas,
  onCanvasLimitReached,
}: CreateNewModalProps) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedCanvasType, setSelectedCanvasType] = useState<CANVAS_TYPE>(
    CANVAS_TYPE.HYBRID
  );
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [creatingProcessPage, setCreatingProcessPage] = useState(false);
  const [creatingDirectory, setCreatingDirectory] = useState(false);

  const folderForm = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
    },
  });

  const canvasForm = useForm<CanvasFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      folderId: currentFolderId || null,
      canvas_type: CANVAS_TYPE.HYBRID,
    },
  });

  // Effect to set the initial step and form values when the modal opens
  useEffect(() => {
    if (isOpen) {
      if (type === "folder") {
        setStep("form");
      } else if (type === "canvas") {
        setStep("select");
      } else {
        setStep("select");
      }

      // Set the folder ID if provided
      if (currentFolderId) {
        canvasForm.setValue("folderId", currentFolderId);
      }
    }
  }, [isOpen, type, currentFolderId, canvasForm]);

  // Effect to update the canvas type in the form when it changes
  useEffect(() => {
    if (selectedCanvasType) {
      canvasForm.setValue("canvas_type", selectedCanvasType);
    }
  }, [selectedCanvasType, canvasForm]);

  const resetForms = () => {
    folderForm.reset();
    canvasForm.reset();
    setSelectedCanvasType(CANVAS_TYPE.HYBRID);
    // Don't leave the Process Page / Directory tiles stuck on "Creating…" if the
    // modal is closed while a create request is still in flight.
    setCreatingProcessPage(false);
    setCreatingDirectory(false);
  };

  const handleClose = () => {
    resetForms();
    setStep("select");
    onClose();
  };

  const handleCreateFolder = (data: FolderFormValues) => {
    onCreateFolder(data.name);
    handleClose();
  };

  const handleCreateCanvas = (data: CanvasFormValues) => {
    const selectedFolder = folders.find(
      (folder) => folder.id === data.folderId
    );

    // Check if a canvas with the same name exists in the selected folder
    if (
      selectedFolder &&
      data.folderId !== "0" &&
      selectedFolder.canvases.some((canvas) => canvas.name === data.name)
    ) {
      canvasForm.setError("name", {
        type: "manual",
        message:
          "A playbook with this name already exists in the selected folder",
      });
      return;
    }

    // Ensure we're using the selected canvas type
    const finalFolderId = data.folderId === "0" ? null : data.folderId;

    const success = onCreateCanvas(
      data.name,
      data.description || "",
      data.canvas_type,
      finalFolderId
    );

    if (success) {
      handleClose();
    }
  };

  // Handle AI generation
  const handleOpenAIDialog = () => {
    // Check if user can use AI
    if (canUseAI && !canUseAI()) {
      if (onAILimitReached) {
        onAILimitReached();
      }
      handleClose();
      return;
    }
    setIsAIDialogOpen(true);
  };

  const handleCloseAIDialog = () => {
    setIsAIDialogOpen(false);
  };

  const handleGenerateCanvas = async (aiData: any) => {
    // HYBRID canvases are diagram-limited.
    if (canCreateCanvas && !canCreateCanvas(CANVAS_TYPE.HYBRID)) {
      onCanvasLimitReached?.();
      handleClose();
      return;
    }

    // Get all existing canvases from both folders and root
    const allCanvases = [
      ...folders.flatMap((folder) => folder.canvases),
      ...(rootCanvases || []),
    ].map((canvas) => ({
      ...canvas,
      canvas_type: CANVAS_TYPE.HYBRID,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const name = generateUntitledName(CANVAS_TYPE.HYBRID, allCanvases);
    const folderId =
      currentFolderId && currentFolderId !== "0" ? currentFolderId : null;

    // Persist the generated diagram server-side BEFORE navigating, via the same
    // proven apply route the agent uses (writes canvas_data: nodes/edges/styles).
    // This replaces the old localStorage handoff, which created an empty canvas,
    // redirected, then applied + saved the diagram client-side on load — a race
    // that lost or stale-loaded data if the save was interrupted.
    try {
      const res = await fetch("/api/ai/agent/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "create",
          target: "canvas",
          name,
          folder_id: folderId,
          diagram: {
            nodes: aiData?.nodes ?? [],
            edges: aiData?.edges ?? [],
            nodeStyles: aiData?.nodeStyles ?? {},
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.canvasId) {
        handleClose();
        window.location.href = `/protected/playbook/${json.canvasId}`;
      } else {
        toast.error(json?.error || "Couldn't create the generated playbook");
      }
    } catch {
      toast.error("Couldn't create the generated playbook");
    }
  };

  // Phase 5: the "Process page" template. Unlike the bare-canvas tiles, this
  // scaffolds a March-style operating-model document (the canonical layout from
  // lib/agent/process-page-template — the SAME factory the agent uses) and seeds
  // its content via the proven agent apply route (which assigns a code + writes
  // document_data), then navigates into it. It's a DOCUMENT only (no live flow
  // yet — a guided placeholder), so it isn't gated by the diagram limit.
  const handleCreateProcessPage = async () => {
    if (creatingProcessPage) return;
    setCreatingProcessPage(true);
    try {
      const existingNames = new Set(
        [
          ...folders.flatMap((folder) => folder.canvases),
          ...(rootCanvases || []),
        ].map((c) => c.name)
      );
      let name = "Process Page";
      for (let n = 2; existingNames.has(name); n++) name = `Process Page ${n}`;

      const folderId =
        currentFolderId && currentFolderId !== "0" ? currentFolderId : null;
      const body = buildProcessPageBlocks({ title: name });

      const res = await fetch("/api/ai/agent/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "create",
          target: "document",
          name,
          folder_id: folderId,
          body,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.canvasId) {
        handleClose();
        window.location.href = `/protected/document-editor/${json.canvasId}`;
      } else {
        toast.error(json?.error || "Couldn't create the process page");
        setCreatingProcessPage(false);
      }
    } catch {
      toast.error("Couldn't create the process page");
      setCreatingProcessPage(false);
    }
  };

  // Phase 5d: create a People Directory — a Table the app recognizes as a roster
  // of people that @person mentions and RACI/approver assignments resolve to.
  // Seeded server-side (Name/Email/Role/Manager columns) via the apply route.
  const handleCreateDirectory = async () => {
    if (creatingDirectory) return;
    setCreatingDirectory(true);
    try {
      const existingNames = new Set(
        [
          ...folders.flatMap((folder) => folder.canvases),
          ...(rootCanvases || []),
        ].map((c) => c.name)
      );
      let name = "Employee Directory";
      for (let n = 2; existingNames.has(name); n++)
        name = `Employee Directory ${n}`;

      const folderId =
        currentFolderId && currentFolderId !== "0" ? currentFolderId : null;

      const res = await fetch("/api/ai/agent/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "create",
          target: "directory",
          name,
          folder_id: folderId,
          directory_kind: "person",
          people: [],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.canvasId) {
        handleClose();
        window.location.href = `/protected/playbook/${json.canvasId}`;
      } else {
        toast.error(json?.error || "Couldn't create the directory");
        setCreatingDirectory(false);
      }
    } catch {
      toast.error("Couldn't create the directory");
      setCreatingDirectory(false);
    }
  };

  // Update the handleTypeSelect function to immediately create an item without showing the form
  const handleTypeSelect = (selectedType: CANVAS_TYPE) => {
    // Only check limits for HYBRID canvas - tables are always free and unlimited
    if (selectedType === CANVAS_TYPE.HYBRID && canCreateCanvas && !canCreateCanvas(selectedType)) {
      if (onCanvasLimitReached) {
        onCanvasLimitReached();
      }
      handleClose();
      return;
    }

    // Get all existing canvases from both folders and root
    const allCanvases = [
      ...folders.flatMap((folder) => folder.canvases),
      ...(rootCanvases || []),
    ].map((canvas) => ({
      ...canvas,
      canvas_type: selectedType,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const name = generateUntitledName(selectedType, allCanvases);

    // Create the item immediately with the current folder ID if available
    // @ts-ignore
    onCreateCanvas(name, "", selectedType, currentFolderId);

    // Close the modal after creation
    onClose();
  };

  const renderContent = () => {
    // Step 1: Type selection (only for canvas)
    if (step === "select" && type === "canvas") {
      // Check limits for HYBRID canvas only - tables are always free and unlimited
      const canCreateHybrid = canCreateCanvas ? canCreateCanvas(CANVAS_TYPE.HYBRID) : true;
      const aiLocked = !!(canUseAI && !canUseAI());

      return (
        <div className="space-y-4 py-2" data-onboarding={ANCHORS.createTiles}>
          {/* The easiest path for a beginner: describe it, let AI draft it. */}
          <button
            type="button"
            onClick={handleOpenAIDialog}
            disabled={aiLocked}
            className={cn(
              "onboarding-ai-option flex w-full items-center gap-4 rounded-lg border p-4 text-start transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              aiLocked
                ? "cursor-not-allowed border-border bg-muted opacity-80"
                : "border-signal/30 bg-signal/5 hover:border-signal/50 hover:bg-signal/10"
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
              <Wand2 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-medium">
                Generate with AI
                {aiLocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-attention-text">
                    <Crown className="h-3 w-3" /> Pro
                  </span>
                ) : (
                  <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[11px] font-medium text-signal">
                    Easiest
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Describe what your team does and AI drafts your first playbook.
              </span>
            </span>
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or start it yourself
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TypeTile
              icon={<GitBranch className="h-5 w-5" />}
              title="Playbook"
              description="Map a process as an editable flow diagram."
              locked={!canCreateHybrid}
              onClick={() => {
                if (!canCreateHybrid) {
                  onCanvasLimitReached?.();
                  handleClose();
                } else {
                  handleTypeSelect(CANVAS_TYPE.HYBRID);
                }
              }}
            />
            <TypeTile
              icon={<TableIcon className="h-5 w-5" />}
              title="Table"
              description="Track activities, owners and RACI, like a spreadsheet."
              className="onboarding-table-option"
              onClick={() => handleTypeSelect(CANVAS_TYPE.TABLE)}
            />
            <TypeTile
              icon={<LayoutTemplate className="h-5 w-5" />}
              title="Process Page"
              description="A ready-made operating-model page: flow, tables and policies."
              busy={creatingProcessPage}
              onClick={() => {
                if (!creatingProcessPage) handleCreateProcessPage();
              }}
            />
            <TypeTile
              icon={<Users className="h-5 w-5" />}
              title="People Directory"
              description="A list of your people to assign owners and approvers."
              busy={creatingDirectory}
              onClick={() => {
                if (!creatingDirectory) handleCreateDirectory();
              }}
            />
          </div>
        </div>
      );
    }

    // Step 2: Form (for both folder and canvas)
    if (step === "form" || type === "folder") {
      if (type === "folder") {
        return (
          <Form {...folderForm}>
            <form
              onSubmit={folderForm.handleSubmit(handleCreateFolder)}
              className="space-y-8"
            >
              <FormField
                control={folderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        placeholder="Enter folder name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="bg-yadn-accent-green">
                  Create Folder
                </Button>
              </DialogFooter>
            </form>
          </Form>
        );
      } else {
        return (
          <Form {...canvasForm}>
            <form
              onSubmit={canvasForm.handleSubmit(handleCreateCanvas)}
              className="space-y-8"
            >
              <FormField
                control={canvasForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playbook Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter playbook name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={canvasForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter playbook description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={canvasForm.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a folder (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep("select")}
                >
                  Back
                </Button>
                <Button type="submit">Create Playbook</Button>
              </DialogFooter>
            </form>
          </Form>
        );
      }
    }

    // Fallback: Generic selection view
    return (
      <div className="grid grid-cols-2 gap-4 py-4">
        <div
          className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg hover:bg-accent cursor-pointer transition-colors"
          onClick={() => {
            setStep("form");
            canvasForm.reset();
          }}
        >
          <div className="mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M3 9h18" />
            </svg>
          </div>
          <span className="font-medium">New Playbook</span>
        </div>

        <div
          className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg hover:bg-accent cursor-pointer transition-colors"
          onClick={() => {
            setStep("form");
            folderForm.reset();
          }}
        >
          <div className="mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-medium">New Folder</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className={`${step === "select" ? "max-w-2xl" : "max-w-md"}`}
        >
          <DialogHeader>
            <DialogTitle>
              {step === "select"
                ? "Create New"
                : type === "folder"
                  ? "Create New Folder"
                  : `Create New ${selectedCanvasType.charAt(0).toUpperCase() + selectedCanvasType.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              {step === "select"
                ? "Select the type of item you want to create"
                : "Enter the details for your new item"}
            </DialogDescription>
          </DialogHeader>

          {renderContent()}
        </DialogContent>
      </Dialog>

      <AIGenerationDialog
        isOpen={isAIDialogOpen}
        onClose={handleCloseAIDialog}
        onGenerateCanvas={handleGenerateCanvas}
      />
    </>
  );
}

/** A consistent, foolproof "what can I make" tile: icon + plain title + one-line
 *  explanation of what you DO with it. Handles Pro-locked and in-flight states. */
function TypeTile({
  icon,
  title,
  description,
  onClick,
  locked = false,
  busy = false,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  locked?: boolean;
  busy?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-busy={busy || undefined}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 text-start transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        busy ? "cursor-wait opacity-80" : "hover:border-signal/50 hover:bg-accent",
        className
      )}
    >
      {locked && (
        <span className="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-attention-tint px-1.5 py-0.5 text-[10px] font-medium text-attention-text">
          <Crown className="h-3 w-3" /> Pro
        </span>
      )}
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal/10 text-signal">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </span>
      <span className="font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">
        {busy ? "Creating…" : description}
      </span>
    </button>
  );
}
