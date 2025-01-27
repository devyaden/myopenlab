import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddNodeSheetProps {
  selectedNode: any;
  onClose: () => void;
  handleEdit: (id: string, key: string, value: string) => void;
  columns: any[];
}

const AddNodeSheet = ({
  selectedNode,
  onClose,
  handleEdit,
  columns,
}: AddNodeSheetProps) => {
  return (
    <Sheet open={!!selectedNode} onOpenChange={() => onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>تفاصيل المستخدم</SheetTitle>
          <SheetDescription>معلومات حول المستخدم المحدد.</SheetDescription>
        </SheetHeader>
        {selectedNode && (
          <div className="py-4">
            {columns.map((column) => (
              <div key={column.key} className="mb-4">
                <Label htmlFor={column.key}>{column.label}</Label>
                <span className="block min-h-[20px]">
                  {selectedNode[column.key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AddNodeSheet;
