"use client";

import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { InputWithIcon } from "../input-with-icon";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";

interface CreateCanvasButtonProps {
  folderId: number;
  userId: string;
  onCanvasCreated?: () => void;
}

const CreateCanvasButton = ({
  folderId,
  userId,
  onCanvasCreated,
}: CreateCanvasButtonProps) => {
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

  const handleSubmit = async (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const defaultFlowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      const { data: canvas, error } = await supabase
        .from("canvases")
        .insert([
          {
            name: formData.name,
            description: formData.description,
            flow_data: defaultFlowData,
            // user_id: userId,
            folder_id: folderId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "نجاح",
        description: "تم إنشاء الملف بنجاح",
      });

      setFormData({ name: "", description: "" });
      setIsOpen(false);

      if (onCanvasCreated) {
        onCanvasCreated();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الملف",
        variant: "destructive",
      });
      console.error("Error creating canvas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Plus className="ml-2 h-4 w-4" />
          <span>ملف جديد</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء ملف جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الملف</Label>
            <InputWithIcon
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              icon={<FileText className="h-4 w-4 text-white" />}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              name="description"
              placeholder="وصف الملف"
              className="border border-gray-300 rounded-md p-2 w-full"
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

export default CreateCanvasButton;
