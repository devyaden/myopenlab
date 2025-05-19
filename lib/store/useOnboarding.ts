import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingStore {
  isFirstVisit: boolean;
  protectedOnBording: boolean;
  createCategoryOnbording: boolean;
  canvasOnbording: boolean;
  data: any[],
  resetOnboarding: () => void;
  setProtectedOnBording: (val: boolean) => void;
  setCreateCategoryOnbording: (val: boolean) => void;
  setCanvasOnbording: (val: boolean) => void;
  setNotFirstVisit: (val: boolean) => void;
  setData: (data: any) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isFirstVisit: true,
      protectedOnBording: true,
      createCategoryOnbording: true,
      canvasOnbording: true,
      data: [],

      setData: (data) => set({data: data}),
      setNotFirstVisit: (val)=> set({isFirstVisit: val}),
      setProtectedOnBording: (val) => set({ protectedOnBording: val }),
      setCreateCategoryOnbording: (val) => set({ createCategoryOnbording: val }),
      setCanvasOnbording: (val) => set({ canvasOnbording: val }),
      resetOnboarding: () =>
        set({
          isFirstVisit: true,
          protectedOnBording: true,
        }),
    }),
    {
      name: "onboarding-store",
    }
  )
);
