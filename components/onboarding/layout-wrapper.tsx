"use client";

import React, { useEffect } from "react";
import { useUser } from "@/lib/contexts/userContext";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { WelcomeCard } from "./WelcomeCard";
import { Spotlight } from "./spotlight";

/**
 * Mounts the onboarding layer at the protected-layout level and keeps the slim
 * store synced to Supabase. The getting-started checklist itself lives inside the
 * dashboard (home-content); coachmarks live inside their surfaces.
 */
const OnboardingController: React.FC = () => {
  const { user } = useUser();
  const { isHydrated, isSyncing, syncWithDatabase } = useOnboardingStore();

  // Stash the user id so the store's debounced background saves can find it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user?.id) (window as any).currentUserId = user.id;
    else delete (window as any).currentUserId;
  }, [user?.id]);

  // One cross-device merge once the store has hydrated from localStorage.
  useEffect(() => {
    if (user?.id && isHydrated && !isSyncing) {
      syncWithDatabase(user.id, true).catch((e) =>
        console.error("onboarding sync failed", e)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isHydrated]);

  return (
    <>
      <WelcomeCard />
      <Spotlight />
    </>
  );
};

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  return (
    <>
      {children}
      <OnboardingController />
    </>
  );
};

export default LayoutWrapper;
