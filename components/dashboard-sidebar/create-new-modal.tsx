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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";

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
    .min(1, "Canvas name is required")
    .max(50, "Canvas name must be 50 characters or less"),
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
}: CreateNewModalProps) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedCanvasType, setSelectedCanvasType] = useState<CANVAS_TYPE>(
    CANVAS_TYPE.HYBRID
  );

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
      folderId: null,
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
    }
  }, [isOpen, type]);

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
          "A canvas with this name already exists in the selected folder",
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

  const handleTypeSelect = (selectedType: CANVAS_TYPE) => {
    setSelectedCanvasType(selectedType);
    canvasForm.setValue("canvas_type", selectedType);
    setStep("form");
  };

  const renderContent = () => {
    // Step 1: Type selection (only for canvas)
    if (step === "select" && type === "canvas") {
      return (
        <div className="grid grid-cols-3 gap-4 py-4">
          <div
            className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => handleTypeSelect(CANVAS_TYPE.HYBRID)}
          >
            <div className="mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-600"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M3 9h18" />
              </svg>
            </div>
            <span className="font-medium text-center">New Canvas</span>
            <span className="text-xs text-center text-muted-foreground mt-1">
              Canvas will be the drawing board to draw diagram
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => handleTypeSelect(CANVAS_TYPE.TABLE)}
          >
            <div className="mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-600"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </div>
            <span className="font-medium text-center">Create Table</span>
            <span className="text-xs text-center text-muted-foreground mt-1">
              Table will be the visual Table to Add Values into The Table
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => handleTypeSelect(CANVAS_TYPE.DOCUMENT)}
          >
            <div className="mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-600"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="8" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="12" y2="18" />
              </svg>
            </div>
            <span className="font-medium text-center">Create Document</span>
            <span className="text-xs text-center text-muted-foreground mt-1">
              Document will be the visual document to add content
            </span>
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
                      <Input placeholder="Enter folder name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                {step !== "select" && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setStep("select")}
                  >
                    Back
                  </Button>
                )}
                <Button type="submit">Create Folder</Button>
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
                    <FormLabel>Canvas Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter canvas name" {...field} />
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
                        placeholder="Enter canvas description"
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
                <Button type="submit">Create Canvas</Button>
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
          className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
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
              className="text-gray-600"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M3 9h18" />
            </svg>
          </div>
          <span className="font-medium">New Canvas</span>
        </div>

        <div
          className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
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
              className="text-gray-600"
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
  );
}
