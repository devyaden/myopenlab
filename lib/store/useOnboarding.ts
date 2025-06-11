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
    value: "Efficient content creation patterns and shortcuts",
    requiresSetup: true,
    context: {
      routes: ["/protected", "/protected/folder/"],
    },
    steps: [
      {
        target: ".onboarding-create-new-btn",
        title: "Smart Creation Menu",
        content:
          "This button adapts to your context and learns your patterns. Let's open it to see all the creation options available to you.",
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
          "Canvases are perfect for brainstorming, flowcharts, mind maps, and visual planning. Unlike documents, you can freely position elements anywhere. Click to create one!",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: true,
      },
      {
        target: ".onboarding-table-option",
        title: "Tables for Structured Data",
        content:
          "Tables are ideal for organizing data, creating lists, tracking projects, and structured information. Perfect for when you need rows and columns.",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: true,
      },
      {
        target: ".onboarding-document-option",
        title: "Documents for Writing",
        content:
          "Documents are great for writing, notes, documentation, and any text-heavy content. They provide rich formatting and structure.",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: true,
      },
      {
        target: ".onboarding-ai-option",
        title: "AI-Powered Creation",
        content:
          "This is where the magic happens! Describe what you want to create and AI will generate a starting structure. Try it - describe an org chart, process flow, or any diagram.",
        placement: "top",
        spotlightPadding: 4,
        spotlightClicks: true,
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

  keyboard_mastery: {
    id: "keyboard_mastery",
    name: "Keyboard Shortcuts",
    description: "Hidden shortcuts that make you 10x faster",
    icon: "⌨️",
    value: "Power user shortcuts and hidden hotkeys",
    context: {
      routes: ["/protected", "/protected/folder/"],
    },
    steps: [
      {
        target: "body",
        title: "Global Shortcuts",
        content:
          'Here are the secret shortcuts power users know: Press "/" to focus search instantly, "n" to create new content, "?" to see all shortcuts. Try pressing "/" now!',
        placement: "top",
        disableBeacon: true,
      },
      {
        target: ".onboarding-search-input",
        title: "Search Like a Pro",
        content:
          'Try these search operators: "type:canvas" finds only canvases, "modified:today" shows recent files, "in:foldername" searches specific folders. Type one now!',
        placement: "bottom",
        spotlightPadding: 8,
        spotlightClicks: true,
      },
    ],
  },
};

interface OnboardingState {
  // Tutorial tracking
  completedTutorials: string[];
  hasSeenWelcome: boolean;
  lastCompletedAt: string | null;

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
  setWelcomeSeen: () => void;
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
  shouldShowTutorial: (tutorialId: string, currentPath?: string) => boolean;
  getContextualTutorials: (currentPath: string) => Tutorial[];
  getNextSuggestedTutorial: (currentPath?: string) => string | null;

  // Database sync
  syncWithDatabase: (userId: string) => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      completedTutorials: [],
      hasSeenWelcome: false,
      lastCompletedAt: null,
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

        // Don't start if already running
        if (state.isRunning && state.activeTutorial) {
          console.warn("Another tutorial is already running");
          return;
        }

        set({
          activeTutorial: tutorialId,
          isRunning: true,
          currentStep: 0,
          waitingForAction: false,
        });
      },

      completeTutorial: (tutorialId: string) => {
        const state = get();
        if (state.completedTutorials.includes(tutorialId)) return;

        set({
          completedTutorials: [...state.completedTutorials, tutorialId],
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
        const skippedId = `${tutorialId}_skipped`;

        if (!state.completedTutorials.includes(skippedId)) {
          set({
            completedTutorials: [...state.completedTutorials, skippedId],
            activeTutorial: null,
            isRunning: false,
            currentStep: 0,
            waitingForAction: false,
          });
        } else {
          set({
            activeTutorial: null,
            isRunning: false,
            currentStep: 0,
            waitingForAction: false,
          });
        }
      },

      resetTutorial: (tutorialId: string) => {
        const state = get();
        const updatedCompleted = state.completedTutorials.filter(
          (id) => id !== tutorialId && id !== `${tutorialId}_skipped`
        );

        set({
          completedTutorials: updatedCompleted,
          activeTutorial: null,
          isRunning: false,
          waitingForAction: false,
        });
      },

      resetAllTutorials: () => {
        set({
          completedTutorials: [],
          hasSeenWelcome: false,
          lastCompletedAt: null,
          activeTutorial: null,
          isRunning: false,
          currentStep: 0,
          waitingForAction: false,
          userBehavior: {
            createdItems: 0,
            foldersCreated: 0,
            searchesPerformed: 0,
            lastActiveDate: null,
          },
        });
      },

      setWelcomeSeen: () => {
        set({ hasSeenWelcome: true });
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

      shouldShowTutorial: (tutorialId: string, currentPath?: string) => {
        const state = get();
        const tutorial = TUTORIALS[tutorialId];

        if (!tutorial || !state.autoStartTutorials) return false;

        const isCompleted = state.completedTutorials.includes(tutorialId);
        const isSkipped = state.completedTutorials.includes(
          `${tutorialId}_skipped`
        );
        const isCurrentlyRunning = state.activeTutorial === tutorialId;

        if (isCompleted || isSkipped || isCurrentlyRunning || state.isRunning) {
          return false;
        }

        // Check if tutorial is contextually relevant
        if (currentPath && tutorial.context.routes.length > 0) {
          const isRelevantRoute = tutorial.context.routes.some(
            (route) => currentPath === route || currentPath.startsWith(route)
          );
          if (!isRelevantRoute) return false;
        }

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
        const state = get();
        return Object.values(TUTORIALS).filter((tutorial) => {
          // Check if tutorial is relevant to current path
          const isRelevantRoute = tutorial.context.routes.some(
            (route) => currentPath === route || currentPath.startsWith(route)
          );

          if (!isRelevantRoute) return false;

          // Check if not completed or skipped
          const isCompleted = state.completedTutorials.includes(tutorial.id);
          const isSkipped = state.completedTutorials.includes(
            `${tutorial.id}_skipped`
          );

          return !isCompleted && !isSkipped;
        });
      },

      getNextSuggestedTutorial: (currentPath?: string) => {
        const state = get();

        // Don't suggest if a tutorial is currently running
        if (state.isRunning || state.activeTutorial) {
          return null;
        }

        // Smart suggestion based on user behavior and context
        const { userBehavior } = state;

        // For new users, start with organization
        if (
          userBehavior.createdItems === 0 &&
          userBehavior.foldersCreated === 0
        ) {
          if (
            currentPath === "/protected" &&
            state.shouldShowTutorial("advanced_organization", currentPath)
          ) {
            return "advanced_organization";
          }
        }

        // If user has created content but not many folders, suggest organization
        if (userBehavior.createdItems >= 3 && userBehavior.foldersCreated < 2) {
          if (state.shouldShowTutorial("advanced_organization", currentPath)) {
            return "advanced_organization";
          }
        }

        // If user is in creation flow, suggest creation workflows
        if (
          currentPath?.includes("/protected") &&
          userBehavior.createdItems < 5
        ) {
          if (state.shouldShowTutorial("creation_workflows", currentPath)) {
            return "creation_workflows";
          }
        }

        // If user has searched multiple times, suggest keyboard shortcuts
        if (userBehavior.searchesPerformed >= 3) {
          if (state.shouldShowTutorial("keyboard_mastery", currentPath)) {
            return "keyboard_mastery";
          }
        }

        // If user is actively using folders, suggest folder mastery
        if (
          currentPath?.includes("/folder/") &&
          userBehavior.foldersCreated >= 1
        ) {
          if (state.shouldShowTutorial("folder_mastery", currentPath)) {
            return "folder_mastery";
          }
        }

        // Default fallback - suggest contextual tutorials
        const contextualTutorials = get().getContextualTutorials(
          currentPath || "/protected"
        );
        return contextualTutorials[0]?.id || null;
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
      name: "onboarding-store-v4",
      version: 1,
      // Only persist essential data
      partialize: (state) => ({
        completedTutorials: state.completedTutorials,
        hasSeenWelcome: state.hasSeenWelcome,
        lastCompletedAt: state.lastCompletedAt,
        autoStartTutorials: state.autoStartTutorials,
        showAdvancedTips: state.showAdvancedTips,
        userBehavior: state.userBehavior,
      }),
    }
  )
);
