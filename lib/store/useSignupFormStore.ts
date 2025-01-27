import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SignupFormData } from "../types/forms.types";

interface FormStore {
  formData: SignupFormData;
  updateFormData: <T extends keyof SignupFormData>(
    step: T,
    data: SignupFormData[T]
  ) => void;
  clearFormData: () => void;
}

const initialState: SignupFormData = {
  personalInfo: null,
  companyInfo: null,
};

const useSignupFormStore = create<FormStore>()(
  persist(
    (set) => ({
      formData: initialState,
      updateFormData: (step, data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            [step]: data,
          },
        })),
      clearFormData: () => set({ formData: initialState }),
    }),
    {
      name: "signup-form-storage",
    }
  )
);

export default useSignupFormStore;
