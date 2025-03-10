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
import { FileText, Folder } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
}: CreateNewModalProps) {
  const [step, setStep] = React.useState(1);
  const [type, setType] = React.useState<"folder" | "canvas" | "table" | null>(
    null
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

  const resetForms = () => {
    folderForm.reset();
    canvasForm.reset();
    setStep(1);
    setType(null);
  };

  const handleClose = () => {
    resetForms();
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
    if (
      selectedFolder &&
      selectedFolder.canvases.some((canvas) => canvas.name === data.name)
    ) {
      canvasForm.setError("name", {
        type: "manual",
        message:
          "A canvas with this name already exists in the selected folder",
      });
      return;
    }

    // Set the canvas type based on the selection or the button type

    const success = onCreateCanvas(
      data.name,
      data.description || "",
      data.canvas_type,
      data.folderId
    );

    if (success) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Create New"
              : type === "folder"
                ? "Create New Folder"
                : "Create New Canvas"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Choose what you want to create"
              : "Enter the details for your new item"}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => {
                setType("folder");
                setStep(2);
              }}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
            >
              <Folder className="h-8 w-8 mb-2" />
              Create New Folder
            </Button>
            <Button
              onClick={() => {
                setType("canvas");
                setStep(2);
              }}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center"
            >
              <FileText className="h-8 w-8 mb-2" />
              Create New Canvas
            </Button>
          </div>
        ) : type === "folder" ? (
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit">Create Folder</Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
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
                name="canvas_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canvas Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select canvas type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CANVAS_TYPE.HYBRID}>
                          Hybrid
                        </SelectItem>
                        <SelectItem value={CANVAS_TYPE.TABLE}>Table</SelectItem>
                        <SelectItem value={CANVAS_TYPE.DOCUMENT}>
                          Document
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit">Create Canvas</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
