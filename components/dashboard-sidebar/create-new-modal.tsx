"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Folder, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CreateNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
  onCreateCanvas: (
    name: string,
    description: string,
    folderId: string | null
  ) => boolean;
  folders: {
    id: string;
    name: string;
    canvases: { id: string; name: string }[];
  }[];
  onCanvasNameChange: (canvasId: string, newName: string) => void;
}

const folderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(50, "Folder name must be 50 characters or less"),
});

const canvasSchema = z.object({
  name: z
    .string()
    .min(1, "Canvas name is required")
    .max(50, "Canvas name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  folderId: z.string().nullable(),
});

type FolderFormValues = z.infer<typeof folderSchema>;
type CanvasFormValues = z.infer<typeof canvasSchema>;

export function CreateNewModal({
  isOpen,
  onClose,
  onCreateFolder,
  onCreateCanvas,
  folders,
  onCanvasNameChange,
}: CreateNewModalProps) {
  const [step, setStep] = React.useState(1);
  const [type, setType] = React.useState<"folder" | "canvas" | null>(null);

  const folderForm = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
    },
  });

  const canvasForm = useForm<CanvasFormValues>({
    resolver: zodResolver(canvasSchema),
    defaultValues: {
      name: "",
      description: "",
      folderId: null,
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
    const success = onCreateCanvas(
      data.name,
      data.description || "",
      data.folderId
    );
    if (success) {
      onCanvasNameChange(Date.now().toString(), data.name);
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
