// components/Sidebar.tsx
"use client";

import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Folder, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CreateFolderButtonProps {
  userId: string | undefined;
  onFolderCreated?: () => void;
}

const CreateFolderButton = ({
  userId,
  onFolderCreated,
}: CreateFolderButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();
  const supabase = createClient();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createBlankCanvas = async (folderId: number) => {
    const defaultFlowData = {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const { data: canvas, error: canvasError } = await supabase
      .from("canvas")
      .insert([
        {
          name: "Untitled",
          description: "Blank canvas",
          flow_data: defaultFlowData,
          user_id: userId,
          folder_id: folderId,
        },
      ])
      .select()
      .single();

    if (canvasError) throw canvasError;
    return canvas;
  };

  const handleSubmit = async (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create folder
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .insert([
          {
            name: formData.name,
            description: formData.description,
            user_id: userId,
          },
        ])
        .select()
        .single();

      if (folderError) throw folderError;

      // Create blank canvas in the new folder
      await createBlankCanvas(folder.id);

      toast({
        title: "Success",
        description: "Folder created with a blank canvas",
      });

      // Reset form and close modal
      setFormData({ name: "", description: "" });
      setIsOpen(false);

      // Trigger refresh of folder list
      if (onFolderCreated) {
        onFolderCreated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
      console.error("Error creating folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Plus className="ml-2 h-4 w-4" />
          <span>مجلد جديد</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء مجلد جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المجلد</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              icon={<Folder className="h-4 w-4 text-white" />}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              name="description"
              placeholder="وصف المجلد"
              className=" border border-gray-300 rounded-md p-2 w-full"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جارٍ الإنشاء..." : "إنشاء"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderButton;
