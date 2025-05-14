import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingStore {
  isFirstVisit: boolean;
  isFirstStepCompleted: boolean;
  data: string | null;
  setNotFirstVisit: () => void;
  setData: (data: string) => void;
  setSecoundStepData: (data: boolean) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isFirstVisit: true,
      isFirstStepCompleted: false,
      data: null,

      setNotFirstVisit: () => set({ isFirstVisit: false }),
      setData: (data) => set({ data: data }),
      setSecoundStepData: (data) => set({ isFirstStepCompleted: data }),
      resetOnboarding: () =>
        set({
          isFirstVisit: true,
          data: null,
        }),
    }),
    {
      name: "onboarding-store",
    }
  )
);
