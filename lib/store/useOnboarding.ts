import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../supabase/client";

export interface TutorialStep {
  target: string;
  content: string;
  title?: string;
  placement?: "top" | "bottom" | "left" | "right";
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
  spotlightPadding?: number;
  hideCloseButton?: boolean;
  showSkipButton?: boolean;
  triggerAction?: () => Promise<boolean> | boolean;
  waitForElement?: string;
  requiresNavigation?: {
    path: string;
    condition?: () => boolean;
  };
  customAction?: {
    type: "open_modal" | "click_element" | "navigate" | "wait";
    target?: string;
    data?: any;
  };
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: TutorialStep[];
  prerequisites?: string[];
  context: {
    routes: string[];
    conditions?: () => boolean;
  };
  value: string;
  requiresSetup?: boolean;
}

export const TUTORIALS: Record<string, Tutorial> = {
  advanced_organization: {
    id: "advanced_organization",
    name: "Smart Organization",
    description: "Learn powerful organization features most users miss",
    icon: "🧠",
    value: "Hidden productivity features and shortcuts",
    context: {
      routes: ["/protected"],
    },
    steps: [
      {
        target: ".onboarding-search-input",
        title: "Global Search Power",
        content:
          'This search works across ALL your content - folders, files, and even inside documents. Try typing "type:canvas" or "modified:today" to see advanced search operators in action.',
        placement: "bottom",
        disableBeacon: true,
        spotlightPadding: 8,
      },
      {
        target: ".onboarding-root-folder",
        title: "Root Folder Strategy",
        content:
          'The Root folder is perfect for temporary files, quick drafts, and items you haven\'t organized yet. Think of it as your "inbox" for new content. Click it to see how it works.',
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: true,
      },
      {
        target: ".onboarding-folder-card:first-child",
        title: "Quick Actions on Hover",
        content:
          "Hover over any folder to see hidden actions. You can rename, delete, or move items without opening menus. Try hovering now!",
        placement: "top",
        spotlightPadding: 4,
      },
    ],
  },

  creation_workflows: {
    id: "creation_workflows",
    name: "Creation Workflows",
    description: "Master the fastest ways to create and organize content",
    icon: "⚡",
    value: "Efficient content creation patterns and AI generation",
    requiresSetup: true,
    context: {
      routes: ["/protected", "/protected/folder/"],
    },
    steps: [
      {
        target: ".onboarding-create-new-btn",
        title: "Smart Creation Menu",
        content:
          "This button is your gateway to creating new content. Let's open it to see all the amazing creation options available to you.",
        placement: "left",
        spotlightPadding: 8,
        spotlightClicks: true,
        customAction: {
          type: "click_element",
          target: ".onboarding-create-new-btn",
        },
        waitForElement: ".onboarding-canvas-option",
      },
      {
        target: ".onboarding-canvas-option",
        title: "Canvas for Visual Thinking",
        content:
          "Canvases are perfect for brainstorming, flowcharts, mind maps, and visual planning. Unlike documents, you can freely position elements anywhere and create visual relationships.",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".onboarding-table-option",
        title: "Tables for Structured Data",
        content:
          "Tables are ideal for organizing data, creating lists, tracking projects, and any structured information. Perfect when you need organized rows and columns.",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".onboarding-document-option",
        title: "Documents for Writing",
        content:
          "Documents are great for writing, notes, documentation, and any text-heavy content. They provide rich formatting and traditional document structure.",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".onboarding-ai-option",
        title: "🤖 AI-Powered Creation - The Magic!",
        content:
          "This is where the real magic happens! Click here to let AI generate entire diagrams, workflows, or visual content based on just your description. It's like having a professional designer at your fingertips!",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: true,
        customAction: {
          type: "click_element",
          target: ".onboarding-ai-option",
        },
        waitForElement: ".language",
      },
      {
        target: ".language",
        title: "Choose Your Language",
        content:
          "Start by selecting your preferred language. The AI will generate content and labels in the language you choose, making it perfect for international teams.",
        placement: "bottom",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".diagram",
        title: "Select Diagram Type",
        content:
          "Choose what type of diagram you want to create. Each type has different templates and structures optimized for specific use cases like workflows, hierarchies, or mind maps.",
        placement: "bottom",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".industry",
        title: "Industry Context",
        content:
          "Select your industry to get relevant examples and terminology. This helps the AI understand your business context and create more accurate, professional diagrams.",
        placement: "bottom",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".prompt",
        title: "Describe Your Vision",
        content:
          "This is where you describe what you want to create. Be specific about processes, relationships, and details. The more detailed your description, the better the AI can bring your vision to life!",
        placement: "bottom",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
      {
        target: ".generate",
        title: "Generate Magic! ✨",
        content:
          "Click here to let AI create your diagram! In moments, you'll have a professional, structured diagram that you can further customize and refine. Try it now - you'll be amazed!",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: false,
      },
    ],
  },

  folder_mastery: {
    id: "folder_mastery",
    name: "Folder Mastery",
    description: "Advanced file management and productivity techniques",
    icon: "📂",
    value: "Professional file organization strategies",
    context: {
      routes: ["/protected/folder/"],
    },
    requiresSetup: true,
    steps: [
      {
        target: ".onboarding-folder-search",
        title: "Scoped Search",
        content:
          "When inside a folder, search only looks within that folder and its subfolders. Try searching for something specific to see how it filters results.",
        placement: "bottom",
        spotlightPadding: 8,
        spotlightClicks: true,
      },
      {
        target: ".onboarding-create-dropdown",
        title: "Context-Aware Creation",
        content:
          "Notice how this menu shows quick creation options. Items created here automatically go into this folder - no need to move them later. Let's open it!",
        placement: "left",
        spotlightPadding: 8,
        spotlightClicks: true,
        customAction: {
          type: "click_element",
          target: ".onboarding-create-dropdown",
        },
      },
      {
        target: ".onboarding-file-actions",
        title: "File Operations",
        content:
          "Hover over files to see quick actions. Pro tip: Hold Shift while clicking to select multiple files for batch operations like moving or deleting.",
        placement: "top",
        spotlightPadding: 4,
      },
      {
        target: ".onboarding-breadcrumb",
        title: "Smart Navigation",
        content:
          "Click any part of the breadcrumb path to jump directly to that level. Much faster than using the back button multiple times. Try it!",
        placement: "bottom",
        spotlightPadding: 4,
        spotlightClicks: true,
      },
    ],
  },
};

interface OnboardingState {
  // Tutorial tracking
  completedTutorials: string[];
  skippedTutorials: string[];
  hasSeenWelcome: boolean;
  lastCompletedAt: string | null;

  // Session state (not persisted)
  welcomeShownThisSession: boolean;

  // Active tutorial state
  activeTutorial: string | null;
  isRunning: boolean;
  currentStep: number;
  waitingForAction: boolean;

  // User preferences
  autoStartTutorials: boolean;
  showAdvancedTips: boolean;

  // Smart suggestions
  userBehavior: {
    createdItems: number;
    foldersCreated: number;
    searchesPerformed: number;
    lastActiveDate: string | null;
  };

  // Actions
  startTutorial: (tutorialId: string) => void;
  completeTutorial: (tutorialId: string) => void;
  stopTutorial: () => void;
  skipTutorial: (tutorialId: string) => void;
  resetTutorial: (tutorialId: string) => void;
  resetAllTutorials: () => void;
  setWelcomeSeen: (showThisSession?: boolean) => void;
  updatePreferences: (
    prefs: Partial<
      Pick<OnboardingState, "autoStartTutorials" | "showAdvancedTips">
    >
  ) => void;
  setWaitingForAction: (waiting: boolean) => void;

  // Smart behavior tracking
  trackUserAction: (action: "create" | "folder_create" | "search") => void;

  // Getters
  isTutorialCompleted: (tutorialId: string) => boolean;
  isTutorialSkipped: (tutorialId: string) => boolean;
  isTutorialAvailable: (tutorialId: string, currentPath?: string) => boolean;
  shouldAutoStartTutorial: (
    tutorialId: string,
    currentPath?: string
  ) => boolean;
  getContextualTutorials: (currentPath: string) => Tutorial[];
  getNextSuggestedTutorial: (currentPath?: string) => string | null;
  getTutorialStatus: (
    tutorialId: string,
    currentPath?: string
  ) => "completed" | "skipped" | "available" | "unavailable";

  // Database sync
  syncWithDatabase: (userId: string) => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      completedTutorials: [],
      skippedTutorials: [],
      hasSeenWelcome: false,
      lastCompletedAt: null,
      welcomeShownThisSession: false,
      activeTutorial: null,
      isRunning: false,
      currentStep: 0,
      waitingForAction: false,
      autoStartTutorials: true,
      showAdvancedTips: true,
      userBehavior: {
        createdItems: 0,
        foldersCreated: 0,
        searchesPerformed: 0,
        lastActiveDate: null,
      },

      // Actions
      startTutorial: (tutorialId: string) => {
        const tutorial = TUTORIALS[tutorialId];
        if (!tutorial) {
          console.warn(`Tutorial ${tutorialId} not found`);
          return;
        }

        const state = get();

        // Stop any currently running tutorial
        if (state.isRunning && state.activeTutorial) {
          console.log(`Stopping current tutorial: ${state.activeTutorial}`);
        }

        console.log(`Starting tutorial: ${tutorialId}`);
        set({
          activeTutorial: tutorialId,
          isRunning: true,
          currentStep: 0,
          waitingForAction: false,
        });
      },

      completeTutorial: (tutorialId: string) => {
        const state = get();

        // Remove from skipped if it was there
        const updatedSkipped = state.skippedTutorials.filter(
          (id) => id !== tutorialId
        );

        // Add to completed if not already there
        const updatedCompleted = state.completedTutorials.includes(tutorialId)
          ? state.completedTutorials
          : [...state.completedTutorials, tutorialId];

        set({
          completedTutorials: updatedCompleted,
          skippedTutorials: updatedSkipped,
          lastCompletedAt: new Date().toISOString(),
          activeTutorial: null,
          isRunning: false,
          currentStep: 0,
          waitingForAction: false,
        });
      },

      stopTutorial: () => {
        set({
          activeTutorial: null,
          isRunning: false,
          currentStep: 0,
          waitingForAction: false,
        });
      },

      skipTutorial: (tutorialId: string) => {
        const state = get();

        // Remove from completed if it was there
        const updatedCompleted = state.completedTutorials.filter(
          (id) => id !== tutorialId
        );

        // Add to skipped if not already there
        const updatedSkipped = state.skippedTutorials.includes(tutorialId)
          ? state.skippedTutorials
          : [...state.skippedTutorials, tutorialId];

        set({
          completedTutorials: updatedCompleted,
          skippedTutorials: updatedSkipped,
          activeTutorial: null,
          isRunning: false,
          currentStep: 0,
          waitingForAction: false,
        });
      },

      resetTutorial: (tutorialId: string) => {
        const state = get();
        const updatedCompleted = state.completedTutorials.filter(
          (id) => id !== tutorialId
        );
        const updatedSkipped = state.skippedTutorials.filter(
          (id) => id !== tutorialId
        );

        set({
          completedTutorials: updatedCompleted,
          skippedTutorials: updatedSkipped,
          activeTutorial: null,
          isRunning: false,
          waitingForAction: false,
        });
      },

      resetAllTutorials: () => {
        set({
          completedTutorials: [],
          skippedTutorials: [],
          lastCompletedAt: null,
          activeTutorial: null,
          isRunning: false,
          currentStep: 0,
          waitingForAction: false,
        });
      },

      setWelcomeSeen: (showThisSession = true) => {
        set({
          hasSeenWelcome: true,
          welcomeShownThisSession: showThisSession,
        });
      },

      updatePreferences: (prefs) => {
        set(prefs);
      },

      setWaitingForAction: (waiting: boolean) => {
        set({ waitingForAction: waiting });
      },

      // Smart behavior tracking
      trackUserAction: (action) => {
        const state = get();
        const newBehavior = { ...state.userBehavior };

        switch (action) {
          case "create":
            newBehavior.createdItems += 1;
            break;
          case "folder_create":
            newBehavior.foldersCreated += 1;
            break;
          case "search":
            newBehavior.searchesPerformed += 1;
            break;
        }

        newBehavior.lastActiveDate = new Date().toISOString();

        set({
          userBehavior: newBehavior,
        });
      },

      // Getters
      isTutorialCompleted: (tutorialId: string) => {
        const state = get();
        return state.completedTutorials.includes(tutorialId);
      },

      isTutorialSkipped: (tutorialId: string) => {
        const state = get();
        return state.skippedTutorials.includes(tutorialId);
      },

      isTutorialAvailable: (tutorialId: string, currentPath?: string) => {
        const tutorial = TUTORIALS[tutorialId];
        if (!tutorial) return false;

        // Always check if tutorial exists first
        return true;
      },

      shouldAutoStartTutorial: (tutorialId: string, currentPath?: string) => {
        const state = get();
        const tutorial = TUTORIALS[tutorialId];
        if (!tutorial) return false;

        // Check if tutorial is contextually relevant
        if (currentPath && tutorial.context.routes.length > 0) {
          const isRelevantRoute = tutorial.context.routes.some(
            (route) => currentPath === route || currentPath.startsWith(route)
          );
          if (!isRelevantRoute) return false;
        }

        // Don't auto-start if user disabled it
        if (!state.autoStartTutorials) return false;

        // Don't auto-start if tutorial is running
        if (state.isRunning) return false;

        // Don't auto-start if completed or skipped
        if (
          state.completedTutorials.includes(tutorialId) ||
          state.skippedTutorials.includes(tutorialId)
        ) {
          return false;
        }

        // Don't auto-start if welcome hasn't been seen yet
        if (!state.hasSeenWelcome) return false;

        // Check prerequisites
        if (tutorial.prerequisites) {
          const hasPrerequisites = tutorial.prerequisites.every((prereq) =>
            state.completedTutorials.includes(prereq)
          );
          if (!hasPrerequisites) return false;
        }

        return true;
      },

      getContextualTutorials: (currentPath: string) => {
        return Object.values(TUTORIALS).filter((tutorial) => {
          // Check if tutorial is contextually relevant to current path
          if (tutorial.context.routes.length > 0) {
            const isRelevantRoute = tutorial.context.routes.some(
              (route) => currentPath === route || currentPath.startsWith(route)
            );
            return isRelevantRoute;
          }
          return false;
        });
      },

      getTutorialStatus: (tutorialId: string, currentPath?: string) => {
        const state = get();
        const tutorial = TUTORIALS[tutorialId];

        if (!tutorial) return "unavailable";

        // Check completion/skip status first (global state)
        if (state.completedTutorials.includes(tutorialId)) {
          return "completed";
        }
        if (state.skippedTutorials.includes(tutorialId)) {
          return "skipped";
        }

        // Check if tutorial is contextually available
        if (currentPath && tutorial.context.routes.length > 0) {
          const isRelevantRoute = tutorial.context.routes.some(
            (route) => currentPath === route || currentPath.startsWith(route)
          );
          if (isRelevantRoute) {
            return "available";
          } else {
            return "unavailable";
          }
        }

        // Default to available if no specific route restrictions
        return "available";
      },

      getNextSuggestedTutorial: (currentPath?: string) => {
        const state = get();

        // Don't suggest if a tutorial is currently running
        if (state.isRunning || state.activeTutorial) {
          return null;
        }

        // Don't suggest if auto-start is disabled
        if (!state.autoStartTutorials) {
          return null;
        }

        // Smart suggestion based on user behavior and context
        const { userBehavior } = state;

        // For new users on home page, start with organization
        if (
          currentPath === "/protected" &&
          userBehavior.createdItems === 0 &&
          userBehavior.foldersCreated === 0 &&
          get().shouldAutoStartTutorial("advanced_organization", currentPath)
        ) {
          return "advanced_organization";
        }

        // If user has created content but not many folders, suggest organization
        if (
          userBehavior.createdItems >= 3 &&
          userBehavior.foldersCreated < 2 &&
          get().shouldAutoStartTutorial("advanced_organization", currentPath)
        ) {
          return "advanced_organization";
        }

        // If user is in creation flow, suggest creation workflows
        if (
          currentPath?.includes("/protected") &&
          userBehavior.createdItems < 5 &&
          get().shouldAutoStartTutorial("creation_workflows", currentPath)
        ) {
          return "creation_workflows";
        }

        // If user is actively using folders, suggest folder mastery
        if (
          currentPath?.includes("/folder/") &&
          userBehavior.foldersCreated >= 1 &&
          get().shouldAutoStartTutorial("folder_mastery", currentPath)
        ) {
          return "folder_mastery";
        }

        // Default fallback - suggest first available tutorial
        const contextualTutorials = get().getContextualTutorials(
          currentPath || "/protected"
        );
        const availableTutorial = contextualTutorials.find((tutorial) =>
          get().shouldAutoStartTutorial(tutorial.id, currentPath)
        );

        return availableTutorial?.id || null;
      },

      // Database sync
      syncWithDatabase: async (userId: string) => {
        try {
          const { data: userData } = await supabase
            .from("user")
            .select("onboarding_data, has_seen_onboarding")
            .eq("id", userId)
            .single();

          if (userData?.onboarding_data) {
            const onboardingData =
              typeof userData.onboarding_data === "string"
                ? JSON.parse(userData.onboarding_data)
                : userData.onboarding_data;

            set({
              completedTutorials: onboardingData.completedTutorials || [],
              skippedTutorials: onboardingData.skippedTutorials || [],
              hasSeenWelcome: userData.has_seen_onboarding || false,
              autoStartTutorials: onboardingData.autoStartTutorials ?? true,
              showAdvancedTips: onboardingData.showAdvancedTips ?? true,
              userBehavior: onboardingData.userBehavior || {
                createdItems: 0,
                foldersCreated: 0,
                searchesPerformed: 0,
                lastActiveDate: null,
              },
            });
          }

          // Save current state to database
          const state = get();
          await supabase
            .from("user")
            .update({
              onboarding_data: {
                completedTutorials: state.completedTutorials,
                skippedTutorials: state.skippedTutorials,
                autoStartTutorials: state.autoStartTutorials,
                showAdvancedTips: state.showAdvancedTips,
                lastCompletedAt: state.lastCompletedAt,
                userBehavior: state.userBehavior,
              },
              has_seen_onboarding: state.hasSeenWelcome,
            })
            .eq("id", userId);
        } catch (error) {
          console.error("Failed to sync onboarding data:", error);
        }
      },
    }),
    {
      name: "onboarding-store-v6",
      version: 1,

      partialize: (state) => ({
        completedTutorials: state.completedTutorials,
        skippedTutorials: state.skippedTutorials,
        hasSeenWelcome: state.hasSeenWelcome,
        lastCompletedAt: state.lastCompletedAt,
        autoStartTutorials: state.autoStartTutorials,
        showAdvancedTips: state.showAdvancedTips,
        userBehavior: state.userBehavior,
      }),
    }
  )
);
