import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Trash2 } from "lucide-react";

interface SubnodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: any;
  newSubNode: any;
  setNewSubNode: (value: any) => void;
  handleAddSubNode: (parentId: string) => void;
  handleDeleteSubNode: (subNodeId: string, parentId: string) => void;
}

export const SubnodesModal: React.FC<SubnodesModalProps> = ({
  isOpen,
  onClose,
  selectedNode,
  newSubNode,
  setNewSubNode,
  handleAddSubNode,
  handleDeleteSubNode,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>العقد الفرعية لـ {selectedNode?.data.label}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg flex-none">
            <h3 className="text-sm font-medium mb-2">إضافة عقدة فرعية جديدة</h3>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="اسم العقدة الفرعية"
                value={newSubNode.label}
                onChange={(e) =>
                  setNewSubNode((prev: any) => ({
                    ...prev,
                    label: e.target.value,
                    parentId: selectedNode?.id,
                  }))
                }
                className="w-48"
              />
              <select
                value={newSubNode.shape}
                onChange={(e) =>
                  setNewSubNode((prev: any) => ({
                    ...prev,
                    shape: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              >
                <option value="square">مستطيل</option>
                <option value="circle">دائرة</option>
                <option value="diamond">معين</option>
                <option value="group">مجموعة</option>
              </select>
              <Button
                size="sm"
                onClick={() => {
                  handleAddSubNode(selectedNode?.id);
                  onClose();
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                إضافة عقدة فرعية
              </Button>
            </div>
          </div>

          <div className="border rounded-lg flex-1 flex flex-col min-h-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الشكل</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedNode?.children?.map((subNode: any) => (
                    <TableRow key={subNode.id} className="hover:bg-gray-50">
                      <TableCell className="max-w-0">
                        <div className="truncate">{subNode.data.label}</div>
                      </TableCell>
                      <TableCell>{subNode.data.shape}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            handleDeleteSubNode(subNode.id, selectedNode.id);
                            onClose();
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubnodesModal;
