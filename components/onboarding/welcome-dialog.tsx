import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingStore, TUTORIALS } from "@/lib/store/useOnboarding";
import { useOnboarding } from "@/components/onboarding/custom-tooltip";
import { useUser } from "@/lib/contexts/userContext";
import { usePathname } from "next/navigation";
import { GraduationCap, Sparkles, ArrowRight } from "lucide-react";

export const WelcomeDialog: React.FC = () => {
  const { user } = useUser();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasCheckedForShow, setHasCheckedForShow] = useState(false);

  const {
    hasSeenWelcome,
    welcomeShownThisSession,
    setWelcomeSeen,
    updatePreferences,
    completedTutorials,
    skippedTutorials,
    isRunning,
    activeTutorial,
    autoStartTutorials,
  } = useOnboardingStore();

  const { startSuggestedTutorial } = useOnboarding();

  // Determine if welcome should be shown
  useEffect(() => {
    if (!user || hasCheckedForShow) {
      return;
    }

    const shouldShow =
      user &&
      pathname === "/protected" &&
      !hasSeenWelcome &&
      !welcomeShownThisSession &&
      completedTutorials.length === 0 &&
      skippedTutorials.length === 0 &&
      !isRunning &&
      !activeTutorial &&
      autoStartTutorials;

    if (shouldShow) {
      console.log("Showing welcome dialog for new user");

      setShowDialog(true);
      setWelcomeSeen(true);

      setHasCheckedForShow(true);
    } else {
      setHasCheckedForShow(true);
    }
  }, [
    user,
    hasSeenWelcome,
    welcomeShownThisSession,
    pathname,
    completedTutorials.length,
    skippedTutorials.length,
    isRunning,
    activeTutorial,
    autoStartTutorials,
    hasCheckedForShow,
    setWelcomeSeen,
  ]);

  // Reset check flag when user changes
  // useEffect(() => {
  //   setHasCheckedForShow(false);
  // }, [user?.id]);

  const handleClose = () => {
    setShowDialog(false);
    setWelcomeSeen();

    if (dontShowAgain) {
      updatePreferences({ autoStartTutorials: false });
    }
  };

  const handleStartTutorial = () => {
    console.log("User clicked Start Tutorial in welcome dialog");
    setShowDialog(false);
    setWelcomeSeen();

    if (dontShowAgain) {
      updatePreferences({ autoStartTutorials: false });
    }

    // Small delay to ensure dialog is fully closed before starting tutorial
    setTimeout(() => {
      console.log("Starting suggested tutorial from welcome dialog");
      const started = startSuggestedTutorial();
      if (!started) {
        console.warn("No suggested tutorial available");
      }
    }, 300);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!showDialog || !user) return null;

  return (
    <Dialog open={showDialog} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-gradient-to-br from-yadn-accent-green to-yadn-accent-blue rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Welcome to your workspace! 🎉
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Let's get you started with a quick tour
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-100">
            <div className="flex items-start gap-4">
              <GraduationCap className="h-8 w-8 text-yadn-accent-blue mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Interactive Tutorials Available
                </h3>
                <p className="text-gray-700 mb-4">
                  We've created step-by-step tutorials to help you master your
                  workspace. These interactive guides will show you exactly
                  where to click and what to do.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.values(TUTORIALS).map((tutorial) => (
                    <div
                      key={tutorial.id}
                      className="flex items-center gap-3 p-3 bg-white rounded border border-gray-100"
                    >
                      <span className="text-xl">{tutorial.icon}</span>
                      <div>
                        <div className="font-medium text-sm">
                          {tutorial.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {tutorial.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">⚡</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Quick Start</h4>
              <p className="text-sm text-gray-600">
                Get productive in minutes, not hours
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">🎯</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Interactive</h4>
              <p className="text-sm text-gray-600">
                Hands-on learning with real examples
              </p>
            </div>
            <div className="text-center p-4">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">🏆</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Track Progress</h4>
              <p className="text-sm text-gray-600">
                See your learning journey unfold
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              // @ts-ignore
              onCheckedChange={setDontShowAgain}
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Don't automatically suggest tutorials in the future (you can
              always access them from the header)
            </label>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-800"
          >
            Skip for now
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              I'll explore on my own
            </Button>
            <Button
              onClick={handleStartTutorial}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white"
            >
              Start Tutorial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
