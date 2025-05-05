"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import toast from "react-hot-toast";
import { LoadingSpinner } from "../loading-spinner";
import {
  LanguageType,
  DiagramType,
  IndustryType,
} from "@/lib/types/diagram-types";
import { InfoIcon } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  language: z.string().min(1, "Language is required"),
  diagramType: z.string().min(1, "Diagram type is required"),
  industry: z.string().min(1, "Industry is required"),
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(1000, "Prompt must be 1000 characters or less"),
});

type FormValues = z.infer<typeof formSchema>;

interface AIGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateCanvas: (data: any) => void;
}

// Example prompts for different diagram types
const examplePrompts = {
  [DiagramType.WORKFLOW]:
    "Create a workflow for handling client onboarding process, including registration, verification, approvals, documents, and first use.",
  [DiagramType.WEBSITE_WIREFRAME]:
    "Design a website wireframe for a business site with home page, about us, services, blog, and contact pages with appropriate sections on each page.",
  [DiagramType.EVENT_VISITOR_EXPERIENCE]:
    "Create an event floor plan for a tech conference with exhibition areas, speaker stages, networking zones, and refreshment areas with visitor journey paths.",
  [DiagramType.HIERARCHY]:
    "Design a company hierarchy chart showing the reporting structure from CEO to department heads to team leaders and team members.",
  [DiagramType.MINDMAP]:
    "Create a mind map for project planning phases including initiation, planning, execution, monitoring, and closure with key activities for each.",
};

export function AIGenerationDialog({
  isOpen,
  onClose,
  onGenerateCanvas,
}: AIGenerationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDiagramType, setSelectedDiagramType] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: LanguageType.ENGLISH,
      diagramType: "",
      industry: "",
      prompt: "",
    },
  });

  const handleDiagramTypeChange = (value: string) => {
    setSelectedDiagramType(value);
    // Don't overwrite existing prompt if user has already started typing
    if (!form.getValues("prompt") || form.getValues("prompt") === "") {
      form.setValue("prompt", examplePrompts[value as DiagramType] || "");
    }
  };

  const handleSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000); // Client-side timeout after 150s

      const response = await fetch("/api/ai/generate-canvas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 408 || error.error?.includes("timeout")) {
          toast.error(
            "Request timed out. Please try a simpler request or try again later."
          );
        } else {
          throw new Error(error.error || "Failed to generate canvas");
        }
        return;
      }

      const result = await response.json();
      onGenerateCanvas(result.data);
      toast.success("Canvas generated successfully!");
      onClose();
    } catch (error) {
      console.error("Error generating canvas:", error);

      let errorMessage = "Failed to generate canvas";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage =
            "Request took too long. Try a simpler prompt or try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Canvas with AI</DialogTitle>
          <DialogDescription>
            Select options and describe what you want to create
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={LanguageType.ENGLISH}>
                        English
                      </SelectItem>
                      <SelectItem value={LanguageType.SPANISH}>
                        Spanish
                      </SelectItem>
                      <SelectItem value={LanguageType.FRENCH}>
                        French
                      </SelectItem>
                      <SelectItem value={LanguageType.GERMAN}>
                        German
                      </SelectItem>
                      <SelectItem value={LanguageType.PORTUGUESE}>
                        Portuguese
                      </SelectItem>
                      <SelectItem value={LanguageType.JAPANESE}>
                        Japanese
                      </SelectItem>
                      <SelectItem value={LanguageType.CHINESE}>
                        Chinese
                      </SelectItem>
                      <SelectItem value={LanguageType.ARABIC}>
                        Arabic
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagramType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Diagram</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleDiagramTypeChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select diagram type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={DiagramType.WORKFLOW}>
                        Workflow
                      </SelectItem>
                      <SelectItem value={DiagramType.WEBSITE_WIREFRAME}>
                        Website Wireframe
                      </SelectItem>
                      <SelectItem value={DiagramType.EVENT_VISITOR_EXPERIENCE}>
                        Event Visitor Experience
                      </SelectItem>
                      <SelectItem value={DiagramType.HIERARCHY}>
                        Hierarchy
                      </SelectItem>
                      <SelectItem value={DiagramType.MINDMAP}>
                        Mind Map
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={IndustryType.MARKETING}>
                        Marketing
                      </SelectItem>
                      <SelectItem value={IndustryType.PROFESSIONAL_SERVICES}>
                        Professional Services & Consulting
                      </SelectItem>
                      <SelectItem value={IndustryType.TRAINING_COACHING}>
                        Training & Coaching
                      </SelectItem>
                      <SelectItem value={IndustryType.PRODUCTION}>
                        Production
                      </SelectItem>
                      <SelectItem value={IndustryType.TECHNOLOGY}>
                        Technology
                      </SelectItem>
                      <SelectItem value={IndustryType.EVENT_MANAGEMENT}>
                        Event Management
                      </SelectItem>
                      <SelectItem value={IndustryType.FINANCIAL_SERVICES}>
                        Financial Services
                      </SelectItem>
                      <SelectItem value={IndustryType.GENERAL}>
                        General
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Prompt</FormLabel>
                    {selectedDiagramType && (
                      <div className="text-xs text-muted-foreground flex items-center">
                        <InfoIcon className="h-3 w-3 mr-1" />
                        Example prompt provided
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you want to create in detail..."
                      className="min-h-32 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    Be specific about entities, relationships, process steps,
                    layout preferences, and level of detail.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
