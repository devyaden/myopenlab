import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  FileX,
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportResult) => void;
  existingNodes: any[];
  existingColumns: any[];
  shapeOptions: string[];
}

interface ImportResult {
  nodes: any[];
  columns: any[];
  replaceExisting: boolean;
}

interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
}

interface ParsedData {
  headers: string[];
  rows: any[][];
  detectedColumns: any[];
}

const COLUMN_TYPE_MAPPING: Record<string, string> = {
  label: "Text",
  task: "Text",
  name: "Text",
  shape: "Select",
  type: "Select",
  id: "Text",
  email: "Email",
  phone: "Phone Number",
  url: "URL",
  website: "URL",
  date: "Date",
  created: "Created Time",
  updated: "Last edited time",
  number: "Number",
  amount: "Number",
  price: "Number",
  quantity: "Number",
  description: "Long Text",
  notes: "Long Text",
  comment: "Long Text",
  completed: "Checkbox",
  active: "Checkbox",
  enabled: "Checkbox",
};

export const ImportDialog: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingNodes,
  existingColumns,
  shapeOptions,
}) => {
  const [currentStep, setCurrentStep] = useState<
    "upload" | "preview" | "confirm"
  >("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSampleCSV = useCallback(() => {
    const headers = [
      "task", // Use "task" instead of "label"
      "type", // Use "type" instead of "shape"
      "description",
      "priority",
      "completed",
      "due_date",
    ];
    const sampleRows = [
      [
        "Design landing page",
        "rectangle",
        "Create a modern landing page design",
        "High",
        "false",
        "2024-12-31",
      ],
      [
        "Implement authentication",
        "circle",
        "Add user login and registration",
        "Medium",
        "true",
        "2024-12-15",
      ],
      [
        "Database setup",
        "hexagon",
        "Configure production database",
        "High",
        "false",
        "2024-12-20",
      ],
      [
        "Setup testing",
        "diamond",
        "Configure testing environment",
        "Low",
        "false",
        "2024-12-25",
      ],
      [
        "Code review",
        "circle",
        "Review pending pull requests",
        "Medium",
        "false",
        "2024-12-28",
      ],
    ];

    // Add a comment row explaining valid type options
    const commentRow = [
      `# Valid type options: ${shapeOptions.join(", ")}`,
      "",
      "",
      "",
      "",
      "",
    ];
    const instructionRow = [
      "# Remove this row before importing",
      "",
      "",
      "",
      "",
      "",
    ];

    const csvContent = [
      commentRow.join(","),
      instructionRow.join(","),
      headers.join(","),
      ...sampleRows.map((row) =>
        row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [shapeOptions]);

  const generateSampleExcel = useCallback(() => {
    const headers = [
      "task", // Use "task" instead of "label"
      "type", // Use "type" instead of "shape"
      "description",
      "priority",
      "completed",
      "due_date",
    ];
    const sampleRows = [
      [
        "Design landing page",
        "rectangle",
        "Create a modern landing page design",
        "High",
        false,
        "2024-12-31",
      ],
      [
        "Implement authentication",
        "circle",
        "Add user login and registration",
        "Medium",
        true,
        "2024-12-15",
      ],
      [
        "Database setup",
        "hexagon",
        "Configure production database",
        "High",
        false,
        "2024-12-20",
      ],
      [
        "Setup testing",
        "diamond",
        "Configure testing environment",
        "Low",
        false,
        "2024-12-25",
      ],
      [
        "Code review",
        "triangle",
        "Review pending pull requests",
        "Medium",
        false,
        "2024-12-28",
      ],
      [
        "Deploy to production",
        "rounded",
        "Deploy application to live environment",
        "Critical",
        false,
        "2024-12-30",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Data");

    // Set column widths
    worksheet["!cols"] = [
      { width: 25 }, // task
      { width: 15 }, // type
      { width: 40 }, // description
      { width: 15 }, // priority
      { width: 12 }, // completed
      { width: 15 }, // due_date
    ];

    // Create data validation for the type column (column B)
    const typeColumnRange = "B2:B1000";

    if (!worksheet["!dataValidation"]) {
      worksheet["!dataValidation"] = [];
    }

    worksheet["!dataValidation"].push({
      sqref: typeColumnRange,
      type: "list",
      operator: "equal",
      formula1: `"${shapeOptions.join(",")}"`,
      allowBlank: true,
      showInputMessage: true,
      showErrorMessage: true,
      promptTitle: "Select Type",
      prompt: "Please select a valid type from the dropdown list.",
      errorTitle: "Invalid Type",
      error: `Please select one of: ${shapeOptions.join(", ")}`,
    });

    // Create a reference sheet with the type options
    const optionsWorksheet = XLSX.utils.aoa_to_sheet([
      ["Available Types"],
      ...shapeOptions.map((option) => [option]),
    ]);

    optionsWorksheet["!cols"] = [{ width: 20 }];
    XLSX.utils.book_append_sheet(workbook, optionsWorksheet, "Type Options");

    // Add some styling to make the type column stand out
    const typeColumnCells = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"];
    typeColumnCells.forEach((cellRef) => {
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: "E8F5E8" } }, // Light green background
          border: {
            top: { style: "thin", color: { rgb: "34C759" } },
            bottom: { style: "thin", color: { rgb: "34C759" } },
            left: { style: "thin", color: { rgb: "34C759" } },
            right: { style: "thin", color: { rgb: "34C759" } },
          },
        };
      }
    });

    XLSX.writeFile(workbook, "sample_import.xlsx");
  }, [shapeOptions]);

  const detectColumnType = useCallback(
    (header: string, values: any[]): string => {
      const lowerHeader = header.toLowerCase();

      // Check mapping first
      if (COLUMN_TYPE_MAPPING[lowerHeader]) {
        return COLUMN_TYPE_MAPPING[lowerHeader];
      }

      // Analyze values to detect type
      const nonEmptyValues = values.filter(
        (v) => v !== null && v !== undefined && v !== ""
      );

      if (nonEmptyValues.length === 0) return "Text";

      // Check for boolean values
      const booleanValues = nonEmptyValues.filter(
        (v) =>
          typeof v === "boolean" ||
          (typeof v === "string" &&
            ["true", "false", "yes", "no", "1", "0"].includes(v.toLowerCase()))
      );
      if (booleanValues.length / nonEmptyValues.length > 0.8) return "Checkbox";

      // Check for numbers
      const numberValues = nonEmptyValues.filter(
        (v) => !isNaN(Number(v)) && v !== ""
      );
      if (numberValues.length / nonEmptyValues.length > 0.8) return "Number";

      // Check for dates
      const dateValues = nonEmptyValues.filter((v) => {
        const date = new Date(v);
        return !isNaN(date.getTime()) && v.toString().length > 4;
      });
      if (dateValues.length / nonEmptyValues.length > 0.8) return "Date";

      // Check for emails
      const emailValues = nonEmptyValues.filter(
        (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      );
      if (emailValues.length / nonEmptyValues.length > 0.8) return "Email";

      // Check for URLs
      const urlValues = nonEmptyValues.filter(
        (v) => typeof v === "string" && /^https?:\/\//.test(v)
      );
      if (urlValues.length / nonEmptyValues.length > 0.8) return "URL";

      // Check for long text (more than 100 characters on average)
      const avgLength =
        nonEmptyValues.reduce((sum, v) => sum + String(v).length, 0) /
        nonEmptyValues.length;
      if (avgLength > 100) return "Long Text";

      return "Text";
    },
    []
  );

  const parseFile = useCallback(
    async (file: File): Promise<ParsedData> => {
      return new Promise((resolve, reject) => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        // Helper function to map CSV headers to existing columns
        const mapHeaderToExistingColumn = (header: string) => {
          const lowerHeader = header.toLowerCase();

          // Check if there's an existing column that matches this header's intent
          const existingColumn = existingColumns.find((col) => {
            const colDataKey = col.dataKey || col.data_key || col.title;
            const colTitle = col.title.toLowerCase();

            // Direct title match
            if (colTitle === lowerHeader) {
              return true;
            }

            // DataKey match
            if (colDataKey.toLowerCase() === lowerHeader) {
              return true;
            }

            // Special mappings for common variations
            if (
              (lowerHeader === "label" ||
                lowerHeader === "task" ||
                lowerHeader === "name") &&
              colDataKey === "label"
            ) {
              return true;
            }

            if (
              (lowerHeader === "shape" || lowerHeader === "type") &&
              colDataKey === "shape"
            ) {
              return true;
            }

            return false;
          });

          return existingColumn;
        };

        if (fileExtension === "csv") {
          Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                reject(
                  new Error(`CSV parsing error: ${results.errors[0].message}`)
                );
                return;
              }

              let rows = results.data as string[][];

              // Filter out comment rows (rows starting with #)
              rows = rows.filter((row) => {
                const firstCell = row[0]?.toString().trim();
                return firstCell && !firstCell.startsWith("#");
              });

              if (rows.length < 2) {
                reject(
                  new Error(
                    "File must contain at least a header row and one data row"
                  )
                );
                return;
              }

              const headers = rows[0].map((h) => h.trim());
              const dataRows = rows.slice(1);

              // Detect column types and map to existing columns or create new ones
              const detectedColumns = headers.map((header, index) => {
                const columnValues = dataRows.map((row) => row[index]);
                const existingColumn = mapHeaderToExistingColumn(header);

                if (existingColumn) {
                  // Use existing column structure
                  return {
                    title: existingColumn.title, // Keep existing title (e.g., "task" instead of "label")
                    type: existingColumn.type,
                    dataKey:
                      existingColumn.dataKey ||
                      existingColumn.data_key ||
                      existingColumn.title,
                    options: existingColumn.options,
                    id: existingColumn.id,
                    order: existingColumn.order,
                    required: existingColumn.required,
                    isExisting: true,
                    originalHeader: header, // Keep track of original CSV header for data mapping
                  };
                } else {
                  // Create new column for non-matching headers
                  const type = detectColumnType(header, columnValues);
                  return {
                    title: header,
                    type: header === "type" ? "Select" : type,
                    dataKey: header,
                    options: header === "type" ? shapeOptions : undefined,
                    isExisting: false,
                    originalHeader: header,
                  };
                }
              });

              resolve({ headers, rows: dataRows, detectedColumns });
            },
            error: (error) => reject(error),
          });
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: "array" });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
              }) as any[][];

              if (jsonData.length < 2) {
                reject(
                  new Error(
                    "File must contain at least a header row and one data row"
                  )
                );
                return;
              }

              const headers = jsonData[0].map((h) => String(h).trim());
              const dataRows = jsonData
                .slice(1)
                .map((row) =>
                  row.map((cell) =>
                    cell === null || cell === undefined ? "" : String(cell)
                  )
                );

              // Apply the same mapping logic as CSV
              const detectedColumns = headers.map((header, index) => {
                const columnValues = dataRows.map((row) => row[index]);
                const existingColumn = mapHeaderToExistingColumn(header);

                if (existingColumn) {
                  return {
                    title: existingColumn.title,
                    type: existingColumn.type,
                    dataKey:
                      existingColumn.dataKey ||
                      existingColumn.data_key ||
                      existingColumn.title,
                    options: existingColumn.options,
                    id: existingColumn.id,
                    order: existingColumn.order,
                    required: existingColumn.required,
                    isExisting: true,
                    originalHeader: header,
                  };
                } else {
                  const type = detectColumnType(header, columnValues);
                  return {
                    title: header,
                    type: header === "type" ? "Select" : type,
                    dataKey: header,
                    options: header === "type" ? shapeOptions : undefined,
                    isExisting: false,
                    originalHeader: header,
                  };
                }
              });

              resolve({ headers, rows: dataRows, detectedColumns });
            } catch (error) {
              reject(new Error(`Excel parsing error: ${error}`));
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          reject(
            new Error(
              "Unsupported file format. Please upload a CSV or Excel file."
            )
          );
        }
      });
    },
    [detectColumnType, shapeOptions, existingColumns]
  );

  const validateData = useCallback(
    (data: ParsedData): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Check required columns by checking if we have columns that map to required dataKeys
      const requiredDataKeys = ["label", "shape"];

      requiredDataKeys.forEach((requiredDataKey) => {
        const hasRequiredColumn = data.detectedColumns.some(
          (col) => col.dataKey === requiredDataKey
        );

        if (!hasRequiredColumn) {
          // Try to provide helpful suggestions based on what headers they have
          const suggestions = [];
          if (requiredDataKey === "label") {
            suggestions.push("'task', 'label', or 'name'");
          } else if (requiredDataKey === "shape") {
            suggestions.push("'type' or 'shape'");
          }

          errors.push({
            row: 0,
            column: requiredDataKey,
            value: "",
            message: `Required column missing. Please include a column for ${requiredDataKey === "label" ? "task/label" : "type/shape"}. Supported header names: ${suggestions.join(", ")}`,
          });
        }
      });

      // Validate data in each row
      data.rows.forEach((row, rowIndex) => {
        data.headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          const column = data.detectedColumns.find(
            (col) => col.originalHeader === header
          );

          if (!column) return;

          // Check required fields based on dataKey
          if (
            ["label", "shape"].includes(column.dataKey) &&
            (!value || value.trim() === "")
          ) {
            errors.push({
              row: rowIndex + 1,
              column: header,
              value,
              message: `Required field '${header}' is empty`,
            });
            return;
          }

          // Type-specific validation
          switch (column.type) {
            case "Email":
              if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push({
                  row: rowIndex + 1,
                  column: header,
                  value,
                  message: "Invalid email format",
                });
              }
              break;
            case "Number":
              if (value && isNaN(Number(value))) {
                errors.push({
                  row: rowIndex + 1,
                  column: header,
                  value,
                  message: "Invalid number format",
                });
              }
              break;
            case "Date":
              if (value && isNaN(new Date(value).getTime())) {
                errors.push({
                  row: rowIndex + 1,
                  column: header,
                  value,
                  message: "Invalid date format",
                });
              }
              break;
            case "Select":
              if (
                column.dataKey === "shape" &&
                value &&
                !shapeOptions.includes(value)
              ) {
                errors.push({
                  row: rowIndex + 1,
                  column: header,
                  value,
                  message: `Invalid type '${value}'. Use Excel sample with dropdown or select from: ${shapeOptions.join(", ")}`,
                });
              }
              break;
          }
        });
      });

      return errors;
    },
    [shapeOptions]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setIsProcessing(true);
      setProgress(0);

      try {
        setProgress(25);
        const parsed = await parseFile(selectedFile);
        setProgress(50);

        const errors = validateData(parsed);
        setProgress(75);

        setParsedData(parsed);
        setValidationErrors(errors);
        setProgress(100);

        setTimeout(() => {
          setCurrentStep("preview");
          setIsProcessing(false);
          setProgress(0);
        }, 500);
      } catch (error) {
        console.error("File parsing error:", error);
        setValidationErrors([
          {
            row: 0,
            column: "file",
            value: selectedFile.name,
            message:
              error instanceof Error ? error.message : "Failed to parse file",
          },
        ]);
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [parseFile, validateData]
  );

  const handleImport = useCallback(() => {
    if (!parsedData || validationErrors.length > 0) return;

    if (existingNodes.length > 0) {
      setShowReplaceDialog(true);
    } else {
      proceedWithImport(false);
    }
  }, [parsedData, validationErrors, existingNodes.length]);

  const proceedWithImport = useCallback(
    (replace: boolean) => {
      if (!parsedData) return;

      const currentUser = "Import User";
      const currentTime = new Date().toISOString();

      const nodes = parsedData.rows.map((row, index) => {
        const nodeData: any = {};

        parsedData.headers.forEach((header, colIndex) => {
          const importColumn = parsedData.detectedColumns.find(
            (col) => col.originalHeader === header
          );
          const value = row[colIndex];

          if (!importColumn) {
            return;
          }

          if (value === "" || value === null || value === undefined) {
            if (value !== false && value !== 0) {
              return;
            }
          }

          let processedValue = value;

          // Process value based on type
          switch (importColumn.type) {
            case "Number":
              processedValue =
                value === "" || value === null ? null : Number(value);
              break;
            case "Checkbox":
              processedValue =
                ["true", "yes", "1", true].includes(
                  String(value).toLowerCase()
                ) || value === true;
              break;
            case "Date":
            case "Created Time":
            case "Last edited time":
              if (value && value !== "" && value !== null) {
                processedValue = new Date(value).toISOString();
              } else {
                processedValue = null;
              }
              break;
            default:
              processedValue = value;
          }

          console.log(`📝 Processing ${header} (${importColumn.dataKey}):`, {
            value,
            processedValue,
            isExisting: importColumn.isExisting,
          });

          // Use the dataKey from the import column (which maps to existing columns correctly)
          const targetDataKey = importColumn.dataKey;

          if (targetDataKey === "label") {
            nodeData.label = processedValue;
          } else if (targetDataKey === "shape") {
            nodeData.shape = processedValue;
          } else if (targetDataKey === "id") {
            nodeData.id = processedValue;
          } else {
            nodeData[targetDataKey] = processedValue;
          }
        });

        // Ensure required fields are present
        if (!nodeData.label) {
          nodeData.label = `Imported Item ${index + 1}`;
          console.log(`🔧 Added default label: ${nodeData.label}`);
        }
        if (!nodeData.shape) {
          nodeData.shape = "rectangle";
          console.log(`🔧 Added default shape: ${nodeData.shape}`);
        }

        // Generate unique node ID
        const nodeId = nodeData.id || `imported-node-${Date.now()}-${index}`;
        if (nodeData.id) {
          delete nodeData.id; // Remove id from data, it's used as the node id
        }

        // Add system timestamps for existing system columns
        existingColumns.forEach((col) => {
          const storageKey = col.dataKey || col.data_key || col.title;

          if (col.type === "Created Time" && !nodeData[storageKey]) {
            nodeData[storageKey] = currentTime;
          } else if (col.type === "Last edited time") {
            nodeData[storageKey] = currentTime;
          } else if (col.type === "Created by" && !nodeData[storageKey]) {
            nodeData[storageKey] = currentUser;
          } else if (col.type === "Last edited by") {
            nodeData[storageKey] = currentUser;
          }
        });

        const finalNode = {
          id: nodeId,
          type: "genericNode",
          position: { x: 0, y: 0 },
          data: nodeData,
        };

        console.log(`✅ Created node ${index + 1}:`, finalNode);
        return finalNode;
      });

      console.log("📦 Generated nodes:", nodes);

      // Handle columns based on mode - ONLY ADD NEW COLUMNS, NOT EXISTING ONES
      let finalColumns;

      if (replace) {
        console.log(
          "🔄 Replace mode: Keeping existing columns, adding new ones if needed"
        );

        // Only add columns that are marked as NOT existing
        const newColumns = parsedData.detectedColumns
          .filter((importCol) => !importCol.isExisting) // Filter out existing columns
          .map((newCol, index) => {
            const columnWithId = {
              ...newCol,
              id: uuidv4(),
              order: existingColumns.length + index,
              required: ["label", "shape"].includes(newCol.dataKey)
                ? true
                : newCol.required || false,
            };
            console.log("➕ Adding new column in replace mode:", columnWithId);
            return columnWithId;
          });

        // In replace mode, we keep existing columns and add new ones
        finalColumns = [...existingColumns, ...newColumns];
      } else {
        console.log("🔗 Merge mode: Adding new columns to existing ones");

        // Only add columns that are marked as NOT existing
        const newColumns = parsedData.detectedColumns
          .filter((importCol) => !importCol.isExisting) // Filter out existing columns
          .map((newCol, index) => {
            const columnWithId = {
              ...newCol,
              id: uuidv4(),
              order: existingColumns.length + index,
              required: ["label", "shape"].includes(newCol.dataKey)
                ? true
                : newCol.required || false,
            };
            console.log("➕ Adding new column in merge mode:", columnWithId);
            return columnWithId;
          });

        finalColumns = [...existingColumns, ...newColumns];
      }

      console.log("🏁 Final columns:", finalColumns);
      console.log("🏁 Final nodes count:", nodes.length);

      onImport({
        nodes,
        columns: finalColumns,
        replaceExisting: replace,
      });

      handleClose();
    },
    [parsedData, existingColumns, onImport]
  );

  const handleClose = useCallback(() => {
    setCurrentStep("upload");
    setFile(null);
    setParsedData(null);
    setValidationErrors([]);
    setIsProcessing(false);
    setProgress(0);
    setShowReplaceDialog(false);
    setReplaceExisting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  }, [onClose]);

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-accent-green/10 rounded-lg flex items-center justify-center mb-4">
          <Upload className="w-6 h-6 text-yadn-accent-green" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Import Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a CSV or Excel file to import data into your table
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="samples">Download Samples</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yadn-accent-green transition-colors">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-2">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-gray-400" />
                <div className="text-sm">
                  <span className="font-medium text-yadn-accent-green">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </div>
                <div className="text-xs text-gray-500">
                  CSV, Excel files up to 10MB
                </div>
                <div className="text-xs text-yadn-accent-green font-medium mt-2">
                  ✅ Download sample file
                </div>
              </div>
            </Label>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="samples" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Download sample files to see the expected format. Your file must
            include columns for task and type.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={generateSampleCSV}
                className="flex items-center gap-2 w-full"
              >
                <Download className="w-4 h-4" />
                Sample CSV
              </Button>
              <p className="text-xs text-gray-500">
                Perfect sample with valid type options
              </p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={generateSampleExcel}
                className="flex items-center gap-2 w-full bg-yadn-accent-green/10 hover:bg-yadn-accent-green/20 text-yadn-accent-green border-yadn-accent-green/20"
              >
                <Download className="w-4 h-4" />
                Sample Excel
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  <strong>Required columns:</strong> task/label and type/shape
                </div>
                <div>
                  <strong>Flexible headers:</strong> Use "task", "label", or
                  "name" for the task column. Use "type" or "shape" for the
                  shape column.
                </div>
                <div>
                  <strong>Supported shapes:</strong>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {shapeOptions.map((option, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {option}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 text-xs text-yadn-accent-green">
                  💡 <strong>Pro tip:</strong> Use Excel sample for dropdown
                  type selection!
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Preview Import</h3>
          <p className="text-sm text-gray-600">
            Review the data and column mappings before importing
          </p>
        </div>
        <Badge
          variant={validationErrors.length > 0 ? "destructive" : "default"}
        >
          {parsedData?.rows.length || 0} rows
        </Badge>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">
              {validationErrors.length} validation error(s) found:
            </div>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-xs">
                    Row {error.row}, {error.column}: {error.message}
                  </div>
                ))}
                {validationErrors.length > 5 && (
                  <div className="text-xs font-medium">
                    ...and {validationErrors.length - 5} more errors
                  </div>
                )}
              </div>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      {parsedData && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Column Mappings</h4>
            <div className="grid grid-cols-1 gap-2">
              {parsedData.detectedColumns.map((col, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      "{col.originalHeader}"
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-medium text-blue-600">
                      {col.title}
                    </span>
                    {col.isExisting && (
                      <Badge variant="secondary" className="text-xs">
                        Existing Column
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">{col.type}</Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Data Preview</h4>
            <ScrollArea className="h-48 border rounded">
              <div className="p-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {parsedData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="text-left p-1 border-b font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="p-1 border-b text-gray-600"
                          >
                            {String(cell).substring(0, 20)}
                            {String(cell).length > 20 && "..."}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > 5 && (
                  <div className="text-center text-xs text-gray-500 mt-2">
                    ...and {parsedData.rows.length - 5} more rows
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Import data from CSV or Excel files into your table
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {currentStep === "upload" && renderUploadStep()}
            {currentStep === "preview" && renderPreviewStep()}
          </ScrollArea>

          <DialogFooter>
            {currentStep === "preview" && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("upload")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validationErrors.length > 0}
                  className="flex-1 bg-yadn-accent-green hover:bg-yadn-accent-green/90"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            )}
            {currentStep === "upload" && (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Data Found</AlertDialogTitle>
            <AlertDialogDescription>
              Your table already contains {existingNodes.length} items. What
              would you like to do?
              <div className="mt-3 space-y-2 text-sm">
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <strong>Add to Existing:</strong> Keep current data and add{" "}
                  {parsedData?.rows.length || 0} new items
                </div>
                <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                  <strong>Replace All:</strong> Remove current{" "}
                  {existingNodes.length} items and replace with{" "}
                  {parsedData?.rows.length || 0} new items
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReplaceDialog(false)}>
              Cancel Import
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowReplaceDialog(false);
                proceedWithImport(false);
              }}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90"
            >
              Add to Existing (
              {existingNodes.length + (parsedData?.rows.length || 0)} total)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowReplaceDialog(false);
                proceedWithImport(true);
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Replace All ({parsedData?.rows.length || 0} items)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
