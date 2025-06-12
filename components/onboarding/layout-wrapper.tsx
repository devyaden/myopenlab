import React from "react";
import { OnboardingManager } from "./custom-tooltip";
import { WelcomeDialog } from "./welcome-dialog";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * Main layout wrapper that provides onboarding functionality
 * to the entire application. This should wrap your main app content.
 *
 * Fixed version that properly manages welcome dialog state and prevents
 * duplicate shows during navigation.
 */
export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  return (
    <OnboardingManager>
      {children}
      <WelcomeDialog />
    </OnboardingManager>
  );
};

export default LayoutWrapper;
