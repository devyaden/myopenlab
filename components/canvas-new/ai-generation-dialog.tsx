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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import {
  DiagramType,
  IndustryType,
  LanguageType,
} from "@/lib/types/diagram-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomJoyrideTooltip from "../CustomJoyrideTooltip";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Joyride from "react-joyride";
import * as z from "zod";

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

const aiCanvasSteps = [
  {
    target: ".language",
    content:
      "Click here to start with a new canvas. This will be your drawing board to create diagrams.",
    disableBeacon: true,
  },
  {
    target: ".diagram",
    content:
      "Click here to create a visual table. You can add values directly to cells for structured data.",
    disableBeacon: true,
  },
  {
    target: ".industry",
    content:
      "Click here to create a visual document. Ideal for drafting and structuring textual content.",
    disableBeacon: true,
  },
  {
    target: ".prompt",
    content:
      "Want help from AI? Click here to generate a diagram automatically based on your input.",
    disableBeacon: true,
  },
  {
    target: ".generate",
    content: "Click to generate",
    disableBeacon: true,
  },
];

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

// Loading state messages for better UX
const loadingMessages = [
  "Crafting your visual story...",
  "Turning ideas into visual elements...",
  "Designing your diagram structure...",
  "Creating meaningful connections...",
  "Building your diagram framework...",
  "Aligning visual components...",
  "Perfecting the visual flow...",
  "Balancing your diagram elements...",
];

const delayedMessages = [
  "Creating a detailed canvas requires careful thought...",
  "Perfecting complex diagrams takes a bit more time...",
  "Almost there! Finalizing your custom diagram...",
];

export function AIGenerationDialog({
  isOpen,
  onClose,
  onGenerateCanvas,
}: AIGenerationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDiagramType, setSelectedDiagramType] = useState<string>("");
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [loadingStartTime, setLoadingStartTime] = useState<number>(0);
  const [isLongLoading, setIsLongLoading] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const { 
    isFirstVisit, 
    createCategoryOnbording, 
    setCreateCategoryOnbording,
    isChecked,
    setIsChecked
  } = useOnboardingStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: LanguageType.ENGLISH,
      diagramType: "",
      industry: "",
      prompt: "",
    },
  });

  // Animation effect for loading messages
  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    let delayCheckInterval: NodeJS.Timeout;

    if (isLoading) {
      // Track when loading started
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      setIsLongLoading(false);

      // Rotate through regular loading messages
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);

      messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 3000);

      // Check if loading is taking longer than expected
      delayCheckInterval = setInterval(() => {
        const loadingTime = Date.now() - startTime;
        if (loadingTime > 15000 && !isLongLoading) {
          // Show delayed message after 15 seconds
          setIsLongLoading(true);
          setLoadingMessage(delayedMessages[0]);
        } else if (loadingTime > 30000 && isLongLoading) {
          // Update delayed message after 30 seconds
          setLoadingMessage(delayedMessages[1]);
        } else if (loadingTime > 45000 && isLongLoading) {
          // Update delayed message after 45 seconds
          setLoadingMessage(delayedMessages[2]);
        }
      }, 5000);
    }

    return () => {
      clearInterval(messageInterval);
      clearInterval(delayCheckInterval);
    };
  }, [isLoading]); // Only depend on isLoading

  // Get loading progress steps based on loading time
  const getProgressSteps = () => {
    const loadingTime = Date.now() - loadingStartTime;

    if (loadingTime < 5000) {
      return {
        analyzing: "active",
        creating: "waiting",
        finalizing: "waiting",
      };
    } else if (loadingTime < 20000) {
      return {
        analyzing: "complete",
        creating: "active",
        finalizing: "waiting",
      };
    } else {
      return {
        analyzing: "complete",
        creating: "complete",
        finalizing: "active",
      };
    }
  };

  const handleDiagramTypeChange = (value: string) => {
    setSelectedDiagramType(value);
    // Don't overwrite existing prompt if user has already started typing
    if (!form.getValues("prompt") || form.getValues("prompt") === "") {
      form.setValue("prompt", examplePrompts[value as DiagramType] || "");
    }
  };

  const handleSubmit = async (data: FormValues) => {
    if (isLoading) return; // Prevent multiple submissions

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

  const handleJoyrideCallback = (data: any) => {
    const { action, index, status, type } = data;

    console.log(action, index, status, type, "action, index, status, type");

    if (status === 'finished' || status === 'skipped') {
      if(isChecked) {
        setCreateCategoryOnbording(false)
        setIsChecked(false)
      }
    }
  };

  const handleDontShowAgainChange = (e: any) => {
    setIsChecked(e.target?.checked)
  }

  // Prevent modal closure during loading
  const handleCloseAttempt = () => {
    if (!isLoading) {
      onClose();
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
      <DialogContent className="max-w-md">
      {isFirstVisit && isMounted && createCategoryOnbording && <Joyride
        steps={aiCanvasSteps}
        run={isFirstVisit}
        callback={handleJoyrideCallback}
        tooltipComponent={(props: any) => (
          <CustomJoyrideTooltip
            {...props} 
            isChecked={isChecked}
            onDontShowAgainChange={handleDontShowAgainChange}
          />
        )}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: '#22c55e',
            zIndex: 10000,
          },
        }}
      />}
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
                <FormItem className="language">
                  <FormLabel>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
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
                <FormItem className="diagram">
                  <FormLabel>Type of Diagram</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleDiagramTypeChange(value);
                    }}
                    defaultValue={field.value}
                    disabled={isLoading}
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
                <FormItem className="industry">
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
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
                <FormItem className="prompt">
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
                      disabled={isLoading}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden"
              >
                {!isLoading && (
                  <div className="flex items-center gap-2 generate">
                    <Sparkles className="h-4 w-4" />
                    <span>Generate</span>
                  </div>
                )}
                {!isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent -translate-x-full hover:animate-shine"></div>
                )}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Overlay for loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="w-[85%] max-w-sm text-center animate-in fade-in zoom-in duration-300">
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full bg-background border border-border/30 mx-auto relative flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary opacity-70" />

                  {/* Animated circles */}
                  <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping opacity-60"></div>
                  <div className="absolute -inset-3 rounded-full border border-primary/5 animate-pulse"></div>
                </div>
              </div>

              <h3 className="text-xl font-medium text-foreground mb-3">
                {loadingMessage}
              </h3>

              {/* Progress steps as simple dots */}
              {/* <div className="flex justify-center gap-2 my-6">
                {(() => {
                  const steps = getProgressSteps();
                  return (
                    <>
                      <div
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          steps.analyzing === "complete"
                            ? "bg-primary"
                            : steps.analyzing === "active"
                              ? "bg-primary/60 animate-pulse"
                              : "bg-primary/20"
                        }`}
                      ></div>
                      <div
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          steps.creating === "complete"
                            ? "bg-primary"
                            : steps.creating === "active"
                              ? "bg-primary/60 animate-pulse"
                              : "bg-primary/20"
                        }`}
                      ></div>
                      <div
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          steps.finalizing === "complete"
                            ? "bg-primary"
                            : steps.finalizing === "active"
                              ? "bg-primary/60 animate-pulse"
                              : "bg-primary/20"
                        }`}
                      ></div>
                    </>
                  );
                })()}
              </div> */}

              {/* Simplified progress bar */}
              <div className="h-1 bg-muted rounded-full overflow-hidden relative max-w-xs mx-auto">
                <div
                  className="h-full bg-primary/70 rounded-full absolute"
                  style={{ animation: "indeterminate 2s ease-in-out infinite" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
