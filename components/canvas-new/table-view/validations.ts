import * as z from "zod";

export const validationSchemas = {
  Email: z.string().email("Invalid email address"),
  "Phone Number": z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number"),
  URL: z.string().url("Invalid URL"),
  Number: z.number().or(z.string().regex(/^-?\d*\.?\d+$/, "Invalid number")),
  Date: z
    .string()
    .refine((value) => !isNaN(new Date(value).getTime()), "Invalid date"),
  Checkbox: z.boolean(),
  Text: z.string(),
  "Long Text": z.string(),
  Select: z.string(),
  Multiselect: z
    .array(z.string())
    .min(1, "At least one option must be selected"),
  "Created Time": z
    .string()
    .refine((value) => !isNaN(new Date(value).getTime()), "Invalid date"),
  "Created by": z.string(),
  "Last edited time": z
    .string()
    .refine((value) => !isNaN(new Date(value).getTime()), "Invalid date"),
  "Last edited by": z.string(),
  User: z.string(),
  Relation: z.array(z.record(z.any())),
  Rollup: z.string().nullable(),
};
