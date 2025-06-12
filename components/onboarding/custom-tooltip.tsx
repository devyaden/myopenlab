import React, { useEffect, useCallback, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride";
import { useOnboardingStore, TUTORIALS } from "@/lib/store/useOnboarding";
import { useUser } from "@/lib/contexts/userContext";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomTooltipProps {
  continuous: boolean;
  index: number;
  size: number;
  step: any;
  backProps: any;
  closeProps: any;
  primaryProps: any;
  skipProps: any;
  tooltipProps: any;
  isLastStep: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  continuous,
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}) => {
  const { activeTutorial, waitingForAction } = useOnboardingStore();
  const tutorial = activeTutorial ? TUTORIALS[activeTutorial] : null;

  return (
    <div
      {...tooltipProps}
      className="bg-white rounded-xl shadow-2xl border border-gray-100 p-0 max-w-sm"
      style={{ ...tooltipProps.style }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-yadn-accent-green to-yadn-accent-blue p-5 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{tutorial?.icon}</span>
            <div>
              <h3 className="text-white font-semibold text-base">
                {step.title || tutorial?.name}
              </h3>
              <p className="text-white/90 text-xs font-medium">
                {tutorial?.value}
              </p>
            </div>
          </div>
          <button
            {...closeProps}
            className="text-white/70 hover:text-white p-1 rounded transition-colors"
            disabled={waitingForAction}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
            style={{ width: `${((index + 1) / size) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-white/80 text-xs">
            Step {index + 1} of {size}
          </span>
          <span className="text-white/80 text-xs">
            {Math.round(((index + 1) / size) * 100)}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-gray-700 text-sm leading-relaxed mb-5">
          {step.content}
        </p>

        {waitingForAction && (
          <div className="flex items-center justify-center mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yadn-accent-green mr-2"></div>
            <span className="text-sm text-blue-700">
              Setting up tutorial...
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {index > 0 && (
              <button
                {...backProps}
                disabled={waitingForAction}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              {...skipProps}
              disabled={waitingForAction}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              Skip
            </button>
            <button
              {...primaryProps}
              disabled={waitingForAction}
              className="px-5 py-2 text-sm bg-yadn-accent-green text-white rounded-lg hover:bg-yadn-accent-green/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {waitingForAction
                ? "Setting up..."
                : isLastStep
                  ? "Complete"
                  : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OnboardingManagerProps {
  children: React.ReactNode;
}

export const OnboardingManager: React.FC<OnboardingManagerProps> = ({
  children,
}) => {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Local state for completion dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completedTutorialId, setCompletedTutorialId] = useState<string | null>(
    null
  );
  const [suggestedTutorialId, setSuggestedTutorialId] = useState<string | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [navigationPending, setNavigationPending] = useState<string | null>(
    null
  );

  const {
    activeTutorial,
    isRunning,
    currentStep,
    waitingForAction,
    completeTutorial,
    stopTutorial,
    skipTutorial,
    isTutorialAvailable,
    shouldAutoStartTutorial,
    getNextSuggestedTutorial,
    startTutorial,
    syncWithDatabase,
    hasSeenWelcome,
    trackUserAction,
    setWaitingForAction,
  } = useOnboardingStore();

  // Sync with database when user is available
  useEffect(() => {
    if (user?.id && !isInitialized) {
      console.log("Syncing onboarding data with database...");
      syncWithDatabase(user.id).finally(() => {
        setIsInitialized(true);
      });
    }
  }, [user?.id, syncWithDatabase, isInitialized]);

  // Navigation helper
  const navigateIfNeeded = useCallback(
    async (tutorialId: string): Promise<boolean> => {
      const tutorial = TUTORIALS[tutorialId];
      if (!tutorial) return false;

      // Check if tutorial requires specific screen
      const currentPath = pathname;
      const isOnCorrectPage = tutorial.context.routes.some(
        (route) => currentPath === route || currentPath.startsWith(route)
      );

      if (!isOnCorrectPage) {
        const targetPath = tutorial.context.routes[0];
        if (targetPath && currentPath !== targetPath) {
          console.log(`Navigating to ${targetPath} for tutorial ${tutorialId}`);

          // Store pending tutorial before navigation
          sessionStorage.setItem("pendingTutorial", tutorialId);
          setNavigationPending(tutorialId);

          // Navigate to target path
          router.push(targetPath);
          return true;
        }
      }

      return false;
    },
    [pathname, router]
  );

  // Interactive step handler with enhanced modal support
  const handleInteractiveStep = useCallback(
    async (step: any, stepIndex: number): Promise<boolean> => {
      if (!step.customAction && !step.triggerAction) return true;

      console.log(`Handling interactive step ${stepIndex}:`, step.title);
      setWaitingForAction(true);

      try {
        // Handle custom actions
        if (step.customAction) {
          const { type, target, data } = step.customAction;

          switch (type) {
            case "click_element":
              if (target) {
                const element = document.querySelector(target) as HTMLElement;
                if (element) {
                  console.log(`Clicking element: ${target}`);
                  element.click();

                  // Wait for modal or UI to open
                  if (step.waitForElement) {
                    await waitForElement(step.waitForElement, 5000);
                  }
                  await new Promise((resolve) => setTimeout(resolve, 500));
                } else {
                  console.warn(`Element not found: ${target}`);
                  return false;
                }
              }
              break;

            case "open_modal":
              console.log("Opening modal for tutorial");
              const createButton = document.querySelector(
                ".onboarding-create-new-btn"
              ) as HTMLElement;
              if (createButton) {
                createButton.click();
                await waitForElement(".onboarding-canvas-option", 5000);
              }
              break;

            case "navigate":
              if (data?.path) {
                router.push(data.path);
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
              break;

            case "wait":
              await new Promise((resolve) =>
                setTimeout(resolve, data?.duration || 1000)
              );
              break;
          }
        }

        // Handle trigger actions
        if (step.triggerAction) {
          const result = await step.triggerAction();
          if (!result) {
            console.warn("Trigger action failed");
            return false;
          }
        }

        // Wait for target element if specified
        if (step.waitForElement) {
          const elementReady = await waitForElement(step.waitForElement, 10000);
          if (!elementReady) {
            console.warn(`Element not ready: ${step.waitForElement}`);
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error("Error in interactive step:", error);
        return false;
      } finally {
        setWaitingForAction(false);
      }
    },
    [router, setWaitingForAction]
  );

  // Wait for element helper with better error handling
  const waitForElement = useCallback(
    async (selector: string, timeout = 5000): Promise<boolean> => {
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          // Additional check for modal elements
          if (selector.includes("dialog") || selector.includes("modal")) {
            // Wait a bit more for modal animations
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.warn(`Element ${selector} not found within ${timeout}ms`);
      return false;
    },
    []
  );

  // Check for pending tutorials after navigation
  useEffect(() => {
    if (user && isInitialized && navigationPending) {
      const pendingTutorial = sessionStorage.getItem("pendingTutorial");

      if (
        pendingTutorial &&
        !isRunning &&
        !activeTutorial &&
        pendingTutorial === navigationPending
      ) {
        console.log(
          "Starting pending tutorial after navigation:",
          pendingTutorial
        );

        // Clear pending state
        sessionStorage.removeItem("pendingTutorial");
        setNavigationPending(null);

        // Wait for page to be ready
        const timer = setTimeout(() => {
          if (isTutorialAvailable(pendingTutorial, pathname)) {
            startTutorial(pendingTutorial);
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    user,
    isInitialized,
    pathname,
    isRunning,
    activeTutorial,
    startTutorial,
    navigationPending,
    isTutorialAvailable,
  ]);

  // Auto-start onboarding for qualified users
  useEffect(() => {
    if (
      !user ||
      !isInitialized ||
      isRunning ||
      activeTutorial ||
      navigationPending
    ) {
      return;
    }

    // Don't auto-start if welcome hasn't been seen
    if (!hasSeenWelcome) {
      return;
    }

    // Don't auto-start if there's a pending tutorial
    if (sessionStorage.getItem("pendingTutorial")) {
      return;
    }

    const nextTutorial = getNextSuggestedTutorial(pathname);
    if (nextTutorial && shouldAutoStartTutorial(nextTutorial, pathname)) {
      console.log("Auto-starting suggested tutorial:", nextTutorial);

      const timer = setTimeout(async () => {
        // Check if navigation is needed
        const didNavigate = await navigateIfNeeded(nextTutorial);

        if (!didNavigate) {
          // Wait for elements to be available
          const elementsReady = await waitForTutorialElements(nextTutorial);
          if (elementsReady && !isRunning && !activeTutorial) {
            startTutorial(nextTutorial);
          }
        }
      }, 2000); // Increased delay for better stability

      return () => clearTimeout(timer);
    }
  }, [
    user,
    isInitialized,
    hasSeenWelcome,
    pathname,
    isRunning,
    activeTutorial,
    navigationPending,
    getNextSuggestedTutorial,
    shouldAutoStartTutorial,
    startTutorial,
    navigateIfNeeded,
  ]);

  // Wait for tutorial elements to be available
  const waitForTutorialElements = useCallback(
    async (tutorialId: string): Promise<boolean> => {
      const tutorial = TUTORIALS[tutorialId];
      if (!tutorial) return false;

      // For tutorials that require setup, don't wait for all elements initially
      if (tutorial.requiresSetup) {
        const firstStep = tutorial.steps[0];
        if (firstStep?.target) {
          return await waitForElement(firstStep.target, 3000);
        }
        return true;
      }

      const maxWaitTime = 5000;
      const checkInterval = 100;
      const maxChecks = maxWaitTime / checkInterval;

      for (let i = 0; i < maxChecks; i++) {
        const allElementsReady = tutorial.steps.every((step) => {
          const element = document.querySelector(step.target);
          return element && element.offsetParent !== null;
        });

        if (allElementsReady) {
          return true;
        }

        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }

      console.warn(
        `Tutorial ${tutorialId} elements not ready after ${maxWaitTime}ms`
      );
      return false;
    },
    [waitForElement]
  );

  // Get current tutorial data
  const currentTutorial = useMemo(() => {
    return activeTutorial ? TUTORIALS[activeTutorial] : null;
  }, [activeTutorial]);

  // Handle tour events with interactive step support
  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { status, action, index, type } = data;

      if (!activeTutorial || !currentTutorial) return;

      console.log("Joyride callback:", { status, action, index, type });

      // Handle step progression
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        const nextStepIndex = index + 1;
        const nextStep = currentTutorial.steps[nextStepIndex];

        if (nextStep) {
          // Handle interactive step before proceeding
          const success = await handleInteractiveStep(nextStep, nextStepIndex);
          if (!success) {
            console.warn("Interactive step failed, stopping tutorial");
            stopTutorial();
            return;
          }
        }
      }

      // Handle tour completion
      if (status === STATUS.FINISHED) {
        completeTutorial(activeTutorial);
        setCompletedTutorialId(activeTutorial);

        // Smart suggestion for next tutorial
        const nextTutorial = getNextSuggestedTutorial(pathname);
        if (nextTutorial && shouldAutoStartTutorial(nextTutorial, pathname)) {
          setSuggestedTutorialId(nextTutorial);
          setShowCompletionDialog(true);
        }
      }

      // Handle tour skip/close
      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        if (activeTutorial) {
          skipTutorial(activeTutorial);
        }
      }

      // Handle error states
      if (status === STATUS.ERROR) {
        console.error("Joyride error:", data);
        stopTutorial();
      }
    },
    [
      activeTutorial,
      currentTutorial,
      handleInteractiveStep,
      completeTutorial,
      skipTutorial,
      stopTutorial,
      getNextSuggestedTutorial,
      shouldAutoStartTutorial,
      pathname,
    ]
  );

  // Handle completion dialog actions
  const handleContinueToNextTutorial = useCallback(async () => {
    setShowCompletionDialog(false);
    if (suggestedTutorialId) {
      // Check if navigation is needed
      const didNavigate = await navigateIfNeeded(suggestedTutorialId);

      if (!didNavigate) {
        // Wait for elements to be ready before starting next tutorial
        const elementsReady =
          await waitForTutorialElements(suggestedTutorialId);
        if (elementsReady) {
          setTimeout(() => {
            startTutorial(suggestedTutorialId);
          }, 500);
        } else {
          console.warn(
            `Cannot start ${suggestedTutorialId} - elements not ready`
          );
        }
      }
    }
    setCompletedTutorialId(null);
    setSuggestedTutorialId(null);
  }, [
    suggestedTutorialId,
    startTutorial,
    navigateIfNeeded,
    waitForTutorialElements,
  ]);

  const handleSkipNextTutorial = useCallback(() => {
    setShowCompletionDialog(false);
    setCompletedTutorialId(null);
    setSuggestedTutorialId(null);
  }, []);

  // Reset completion dialog when active tutorial changes
  useEffect(() => {
    if (!activeTutorial) {
      setShowCompletionDialog(false);
      setCompletedTutorialId(null);
      setSuggestedTutorialId(null);
    }
  }, [activeTutorial]);

  return (
    <>
      {children}

      {/* Joyride Tutorial */}
      {isRunning && currentTutorial && (
        <Joyride
          steps={currentTutorial.steps}
          run={isRunning && !waitingForAction}
          continuous
          showProgress={false}
          showSkipButton={false}
          disableOverlayClose
          disableCloseOnEsc={false}
          callback={handleJoyrideCallback}
          tooltipComponent={CustomTooltip}
          styles={{
            options: {
              primaryColor: "#22c55e",
              zIndex: 10000,
            },
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
            spotlight: {
              backgroundColor: "transparent",
              border: "3px solid #22c55e",
              borderRadius: "12px",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
            },
            beacon: {
              inner: "#22c55e",
              outer: "#22c55e",
            },
          }}
          floaterProps={{
            disableAnimation: false,
            styles: {
              floater: {
                filter: "drop-shadow(0 20px 25px rgba(0, 0, 0, 0.15))",
              },
            },
          }}
        />
      )}

      {/* Tutorial Completion Dialog */}
      <Dialog
        open={showCompletionDialog}
        onOpenChange={(open) => !open && handleSkipNextTutorial()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🎉</span>
              </div>
              <div>
                <div className="text-lg font-semibold">Tutorial Complete!</div>
                <div className="text-sm text-muted-foreground font-normal">
                  You're getting more productive!
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {completedTutorialId && TUTORIALS[completedTutorialId] && (
                <>
                  Great job mastering{" "}
                  <strong>{TUTORIALS[completedTutorialId].name}</strong>!
                  {suggestedTutorialId && TUTORIALS[suggestedTutorialId] && (
                    <>
                      <br />
                      <br />
                      Ready to learn{" "}
                      <strong>{TUTORIALS[suggestedTutorialId].name}</strong>?
                      <span className="text-sm text-muted-foreground block mt-1">
                        {TUTORIALS[suggestedTutorialId].value}
                      </span>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkipNextTutorial}
              className="flex-1"
            >
              I'll explore on my own
            </Button>
            {suggestedTutorialId && (
              <Button
                onClick={handleContinueToNextTutorial}
                className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 flex-1"
              >
                Continue Learning
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Enhanced hook for components to interact with onboarding
export const useOnboarding = () => {
  const {
    startTutorial,
    stopTutorial,
    isTutorialCompleted,
    isTutorialSkipped,
    isTutorialAvailable,
    isRunning,
    activeTutorial,
    getContextualTutorials,
    trackUserAction,
    getNextSuggestedTutorial,
    resetTutorial,
  } = useOnboardingStore();

  const pathname = usePathname();
  const router = useRouter();

  const startSpecificTutorial = useCallback(
    async (tutorialId: string) => {
      const tutorial = TUTORIALS[tutorialId];
      if (!tutorial) {
        console.warn(`Tutorial ${tutorialId} not found`);
        return false;
      }

      // Check if tutorial requires navigation
      const currentPath = window.location.pathname;
      const isOnCorrectPage = tutorial.context.routes.some(
        (route) => currentPath === route || currentPath.startsWith(route)
      );

      if (!isOnCorrectPage) {
        // Navigate to appropriate page
        const targetRoute = tutorial.context.routes[0];
        if (targetRoute) {
          console.log(
            `Navigating to ${targetRoute} for tutorial ${tutorialId}`
          );

          // Store pending tutorial before navigation
          sessionStorage.setItem("pendingTutorial", tutorialId);
          router.push(targetRoute);
          return true;
        }
      }

      // Start tutorial immediately if on correct page
      startTutorial(tutorialId);
      return true;
    },
    [startTutorial, router]
  );

  const startSuggestedTutorial = useCallback(() => {
    const nextTutorial = getNextSuggestedTutorial(pathname);
    if (nextTutorial && isTutorialAvailable(nextTutorial, pathname)) {
      return startSpecificTutorial(nextTutorial);
    }
    return false;
  }, [
    getNextSuggestedTutorial,
    isTutorialAvailable,
    startSpecificTutorial,
    pathname,
  ]);

  const getAvailableTutorials = useCallback(() => {
    return getContextualTutorials(pathname);
  }, [getContextualTutorials, pathname]);

  const restartTutorial = useCallback(
    (tutorialId: string) => {
      resetTutorial(tutorialId);
      // Small delay to ensure state is updated
      setTimeout(() => {
        startSpecificTutorial(tutorialId);
      }, 100);
    },
    [resetTutorial, startSpecificTutorial]
  );

  const trackCreate = useCallback(() => {
    trackUserAction("create");
  }, [trackUserAction]);

  const trackFolderCreate = useCallback(() => {
    trackUserAction("folder_create");
  }, [trackUserAction]);

  const trackSearch = useCallback(() => {
    trackUserAction("search");
  }, [trackUserAction]);

  return {
    startTutorial: startSpecificTutorial,
    startSuggestedTutorial,
    restartTutorial,
    stopTutorial,
    isTutorialCompleted,
    isTutorialSkipped,
    isTutorialAvailable: (tutorialId: string) =>
      isTutorialAvailable(tutorialId, pathname),
    isRunning,
    activeTutorial,
    getAvailableTutorials,
    trackCreate,
    trackFolderCreate,
    trackSearch,
    tutorials: TUTORIALS,
  };
};
