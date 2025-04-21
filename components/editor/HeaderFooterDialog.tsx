"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Upload } from "lucide-react";

interface HeaderFooterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: HeaderFooterConfig) => void;
  initialConfig?: HeaderFooterConfig;
  type: "header" | "footer";
}

export interface HeaderFooterConfig {
  type: "header" | "footer";
  includeCompanyLogo: boolean;
  companyLogoUrl: string;
  companyName: string;
  alignment: "left" | "center" | "right";
  showPageNumbers: boolean;
  showDate: boolean;
  customText: string;
  style: "simple" | "bold" | "minimal" | "corporate";
}

const defaultConfig: HeaderFooterConfig = {
  type: "header",
  includeCompanyLogo: false,
  companyLogoUrl: "",
  companyName: "",
  alignment: "left",
  showPageNumbers: false,
  showDate: false,
  customText: "",
  style: "simple",
};

const presetStyles = [
  { id: "simple", name: "Simple", description: "Clean, minimalist design" },
  {
    id: "bold",
    name: "Bold",
    description: "Eye-catching with prominent elements",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Text-only, professional appearance",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Classic business design",
  },
];

export default function HeaderFooterDialog({
  isOpen,
  onClose,
  onApply,
  initialConfig,
  type,
}: HeaderFooterDialogProps) {
  const [config, setConfig] = useState<HeaderFooterConfig>({
    ...defaultConfig,
    type,
  });
  const [activeTab, setActiveTab] = useState<string>("content");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      setConfig({
        ...defaultConfig,
        type,
      });
    }
  }, [initialConfig, type, isOpen]);

  const handleApply = () => {
    onApply(config);
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig({
          ...config,
          companyLogoUrl: event.target?.result as string,
          includeCompanyLogo: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogoClick = () => {
    document.getElementById("logo-upload")?.click();
  };

  // Implementation of fix for the dialog pointer events issue
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      document.body.style.pointerEvents = "";
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {type === "header" ? "Customize Header" : "Customize Footer"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {/* Company Logo */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-logo"
                  checked={config.includeCompanyLogo}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      includeCompanyLogo: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="include-logo">Include company logo</Label>
              </div>

              {config.includeCompanyLogo && (
                <div className="flex flex-col space-y-2 ml-6">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={uploadLogoClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    {config.companyLogoUrl && (
                      <div className="w-10 h-10 border rounded overflow-hidden">
                        <img
                          src={config.companyLogoUrl || "/placeholder.svg"}
                          alt="Company logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={config.companyName}
                onChange={(e) =>
                  setConfig({ ...config, companyName: e.target.value })
                }
                placeholder="Enter company name"
              />
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <Label>Alignment</Label>
              <ToggleGroup
                type="single"
                value={config.alignment}
                onValueChange={(value) => {
                  if (value)
                    setConfig({
                      ...config,
                      alignment: value as "left" | "center" | "right",
                    });
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="left" aria-label="Left align">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Center align">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Right align">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Additional Elements */}
            <div className="space-y-2">
              <Label>Additional Elements</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-page-numbers"
                    checked={config.showPageNumbers}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        showPageNumbers: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="show-page-numbers">Page Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-date"
                    checked={config.showDate}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, showDate: checked as boolean })
                    }
                  />
                  <Label htmlFor="show-date">Current Date</Label>
                </div>
              </div>
            </div>

            {/* Custom Text */}
            <div className="space-y-2">
              <Label htmlFor="custom-text">Custom Text</Label>
              <Input
                id="custom-text"
                value={config.customText}
                onChange={(e) =>
                  setConfig({ ...config, customText: e.target.value })
                }
                placeholder="Additional text (optional)"
              />
            </div>
          </TabsContent>

          <TabsContent value="style">
            <div className="space-y-4">
              <Label>Style Preset</Label>
              <div className="grid grid-cols-2 gap-3">
                {presetStyles.map((style) => (
                  <div
                    key={style.id}
                    className={`border rounded-md p-2 cursor-pointer transition-all ${
                      config.style === style.id
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-gray-400"
                    }`}
                    onClick={() =>
                      setConfig({ ...config, style: style.id as any })
                    }
                  >
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-gray-500">
                      {style.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
