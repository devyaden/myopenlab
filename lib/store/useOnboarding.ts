import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../supabase/client";

interface OnboardingStore {
  isFirstVisit: boolean;
  protectedOnBording: boolean;
  createCategoryOnbording: boolean;
  canvasOnbording: boolean;
  isChecked: boolean;
  onBoardingTour: boolean;
  data: any[];
  resetOnboarding: () => void;
  setProtectedOnBording: (val: boolean) => void;
  setCreateCategoryOnbording: (val: boolean) => void;
  setCanvasOnbording: (val: boolean) => void;
  setNotFirstVisit: (val: boolean) => void;
  setOnBoardingTour: (val: boolean) => void;
  setIsChecked: (val: boolean) => void;
  setData: (data: any) => void;
  updateUserOnboardingStatus: (
    userId: string,
    status: boolean
  ) => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isFirstVisit: true,
      protectedOnBording: true,
      createCategoryOnbording: true,
      canvasOnbording: true,
      onBoardingTour: true,
      data: [],
      isChecked: false,

      setData: (data) => set({ data: data }),
      setNotFirstVisit: (val) => set({ isFirstVisit: val }),
      setOnBoardingTour: (val) => set({ onBoardingTour: val }),
      setProtectedOnBording: (val) => set({ protectedOnBording: val }),
      setCreateCategoryOnbording: (val) =>
        set({ createCategoryOnbording: val }),
      setCanvasOnbording: (val) => set({ canvasOnbording: val }),
      setIsChecked: (val) => set({ isChecked: val }),
      resetOnboarding: () =>
        set({
          isChecked: false,
          isFirstVisit: true,
          protectedOnBording: true,
          onBoardingTour: true,
        }),

      updateUserOnboardingStatus: async (userId, status) => {
        await supabase
          .from("user")
          .update({ has_seen_onboarding: Boolean(status) })
          .eq("id", userId);

        set({ isFirstVisit: !status });
      },
    }),
    {
      name: "onboarding-store",
    }
  )
);
