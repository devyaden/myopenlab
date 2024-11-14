import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COLUMN_TYPES } from "@/types/column-types.enum";
import { ArrowUpDown, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const typeTranslations = {
  [COLUMN_TYPES.STRING]: {
    en: "Text",
    ar: "نص",
    description: {
      en: "Store text values",
      ar: "تخزين القيم النصية",
    },
  },
  [COLUMN_TYPES.NUMBER]: {
    en: "Number",
    ar: "رقم",
    description: {
      en: "Store numeric values",
      ar: "تخزين القيم الرقمية",
    },
  },
  [COLUMN_TYPES.DATE]: {
    en: "Date",
    ar: "تاريخ",
    description: {
      en: "Store date values",
      ar: "تخزين قيم التاريخ",
    },
  },
  [COLUMN_TYPES.BOOLEAN]: {
    en: "Boolean",
    ar: "منطقي",
    description: {
      en: "True/False values",
      ar: "قيم صح/خطأ",
    },
  },
  [COLUMN_TYPES.RELATION]: {
    en: "Relation",
    ar: "علاقة",
    description: {
      en: "Link to other canvas",
      ar: "ربط مع لوحة أخرى",
    },
  },
  [COLUMN_TYPES.ROLLUP]: {
    en: "Rollup",
    ar: "تجميع",
    description: {
      en: "Aggregate related data",
      ar: "تجميع البيانات المرتبطة",
    },
  },
};

interface FlowTableHeaderProps {
  columns: any[];
  updateColumnTitle: (key: string, title: string) => void;
  toggleColumnVisibility: (key: string) => void;
  setNewColumn: (newColumn: any) => void;
  addNewColumn: () => void;
  newColumn: any;
  fetchFolderCanvases: () => Promise<any>;
  relations: any[];
  canvasDetails: any;
}

const FlowTableHeader = ({
  columns,
  updateColumnTitle,
  toggleColumnVisibility,
  setNewColumn,
  addNewColumn,
  newColumn,
  fetchFolderCanvases,
  relations,
  canvasDetails,
}: FlowTableHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<any>(null);

  const [selectedField, setSelectedField] = useState<any>(null);

  const filteredCanvases = canvases.filter((option: any) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFormValid = () => {
    if (!newColumn.name.trim()) return false;
    if (newColumn.validationType === COLUMN_TYPES.RELATION) {
      return Boolean(newColumn.target_canvas_id);
    }

    if (newColumn.validationType === COLUMN_TYPES.ROLLUP) {
      return Boolean(selectedRelation) && Boolean(selectedField);
    }
    return true;
  };

  const handleRelationSelect = (relationId: number) => {
    setNewColumn({
      ...newColumn,
      target_canvas_id: relationId,
    });
  };

  const handleRollupRelationSelect = (relation: any) => {
    setSelectedRelation(relation);
    setNewColumn({
      ...newColumn,
      relation_id: relation.id,
    });
  };

  const handleRollupFieldSelect = (field: any) => {
    setSelectedField(field);
    setNewColumn({
      ...newColumn,
      target_column: field?.key,
    });
  };

  const handleFolderCanvases = async () => {
    setLoading(true);
    const { data } = await fetchFolderCanvases();
    setCanvases(data);
    setLoading(false);
  };

  const canvasesWithRelations = useMemo(() => {
    return relations?.map((relation) => ({
      id: relation.id,
      targetCanvas: relation?.target_canvas,
      columns: [
        {
          name: "Id",
          key: "id",
        },
        {
          name: "Key",
          key: "key",
        },

        ...relation?.target_canvas?.columns?.map?.((column: any) => ({
          name: column?.name,
          key: column?.key,
        })),
      ],
    }));
  }, [relations]);

  const handleFormSubmission = async () => {
    addNewColumn();
  };

  useEffect(() => {
    if (newColumn.validationType === COLUMN_TYPES.RELATION) {
      handleFolderCanvases();
    }
  }, [newColumn.validationType]);

  return (
    <TableHeader>
      <TableRow>
        {columns
          .filter((column) => !column.hidden)
          .map((column, index) => (
            <TableHead key={index.toString()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2">
                  {column.label}
                  <ArrowUpDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="p-2">
                    <Input
                      defaultValue={column.label}
                      onBlur={(e) =>
                        updateColumnTitle(column.key, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateColumnTitle(column.key, e.currentTarget.value);
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toggleColumnVisibility(column.key)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />

                    <span className="mr-2 text-gray-500 text-sm">
                      إخفاء في العرض
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-red-500">
                    <Trash2 className="w-4 h-4" />

                    <span className="mr-2 text-gray-500 text-sm">
                      حذف الخاصية
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
          ))}
        <TableHead>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only mt-4">إضافة عمود جديد</span>
              </Button>
            </SheetTrigger>

            <SheetContent className="sm:max-w-[500px]">
              <SheetHeader className="space-y-2 mb-6">
                <SheetTitle>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-gray-500">إضافة عمود جديد</span>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  <div className="space-y-1">
                    <p className="text-right text-gray-500">
                      قم بتكوين خصائص العمود الجديد. جميع الحقول المميزة بـ *
                      مطلوبة.
                    </p>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="flex justify-between text-sm font-medium"
                  >
                    <span className="text-gray-500">اسم العمود *</span>
                  </Label>
                  <Input
                    id="name"
                    value={newColumn.name}
                    onChange={(e) =>
                      setNewColumn({ ...newColumn, name: e.target.value })
                    }
                    placeholder="أدخل اسم العمود"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="validationType"
                    className="flex justify-between text-sm font-medium"
                  >
                    <span className="text-gray-500">نوع العمود *</span>
                  </Label>
                  <Select
                    value={newColumn.validationType}
                    onValueChange={(value) =>
                      setNewColumn({
                        ...newColumn,
                        validationType: value as COLUMN_TYPES,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder=" اختر نوع العمود" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeTranslations).map(
                        ([type, translation]) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-gray-500 text-sm text-right">
                                <span>{translation.ar}</span>
                                <span className="mr-1">
                                  - {translation.description.ar}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {newColumn.validationType === COLUMN_TYPES.RELATION && (
                  <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm font-medium">
                        <span className="text-gray-500">
                          اختر اللوحة للربط *
                        </span>
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder=" البحث في اللوحات..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm text-gray-500">
                        <span>اللوحات المتاحة</span>
                      </Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md bg-white">
                        {loading ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            جارِ التحميل...
                          </div>
                        ) : filteredCanvases.length > 0 ? (
                          filteredCanvases.map((canvas: any) => (
                            <button
                              key={canvas.id}
                              onClick={() => handleRelationSelect(canvas.id)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors
                                ${newColumn.target_canvas_id === canvas.id ? "bg-gray-100 font-medium" : ""}
                                ${filteredCanvases.length === 1 ? "" : "border-b border-gray-100"}
                              `}
                            >
                              {canvas.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            <p className="text-sm">
                              لم يتم العثور على لوحة مطابقة
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {newColumn.validationType === COLUMN_TYPES.ROLLUP && (
                  <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm text-gray-500">
                        <span>Select a relation</span>
                      </Label>
                      <Select
                        value={selectedRelation?.id || ""}
                        onValueChange={(value) => {
                          const relation = canvasesWithRelations.find(
                            (r) => r.id === value
                          );

                          handleRollupRelationSelect(relation);
                        }}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select a relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {canvasesWithRelations.length > 0 ? (
                            canvasesWithRelations.map((relation: any) => (
                              <SelectItem
                                key={relation.id}
                                value={relation.id}
                                className="cursor-pointer"
                              >
                                {relation?.targetCanvas?.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No available relations found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex justify-between text-sm text-gray-500">
                        <span>Select field</span>
                      </Label>
                      <Select
                        value={selectedField?.name || ""}
                        onValueChange={(value) => {
                          const column = selectedRelation?.columns.find(
                            (c: any) => c.key === value
                          );
                          handleRollupFieldSelect(column);
                        }}
                        disabled={!selectedRelation}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedRelation ? (
                            selectedRelation.columns.map((column: any) => (
                              <SelectItem
                                key={column.key}
                                value={column.key}
                                className="cursor-pointer"
                              >
                                {column.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Select a relation to select field
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-6">
                <Button
                  onClick={() => handleFormSubmission()}
                  disabled={!isFormValid()}
                  className="w-full"
                >
                  <span className="mr-2 text-sm">إضافة عمود</span>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default FlowTableHeader;
