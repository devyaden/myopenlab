import { z } from "zod";

export const positions = [
  "Design Head",
  "Manager",
  "CEO",
  "UI UX Designer",
  "Product Owner",
  "Developer",
  "Product Designer",
  "Other",
] as const;

export const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

export const sectors = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Other",
] as const;

export const companyFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyEmail: z.string().email("Please enter a valid email address"),
  companySector: z.enum(sectors, {
    required_error: "Please select a company sector",
  }),
  position: z.enum(positions, {
    required_error: "Please select your position",
  }),
  companySize: z.enum(companySizes, {
    required_error: "Please select company size",
  }),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;
