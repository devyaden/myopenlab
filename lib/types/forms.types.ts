// types/form.ts
export interface SignupPersonalInfo {
  email: string;
  username?: string;
}

export interface SignupCompanyInfo {
  companyName: string;
  companyEmail: string;
  companySector: string;
  userPosition: string;
  companySize: string;
}

export interface SignupFormData {
  personalInfo: SignupPersonalInfo | null;
  companyInfo: SignupCompanyInfo | null;
}
