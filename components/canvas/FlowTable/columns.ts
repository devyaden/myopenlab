export const COLUMN_TYPES = {
  TEXT: {
    id: "text",
    label: "Text",
    validation: { type: "string" },
  },
  EMAIL: {
    id: "email",
    label: "Email",
    validation: {
      type: "email",
      pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    },
  },
  NUMBER: {
    id: "number",
    label: "Number",
    validation: { type: "number" },
  },
  DATE: {
    id: "date",
    label: "Date",
    validation: { type: "date" },
  },
  URL: {
    id: "url",
    label: "URL",
    validation: { type: "url", pattern: "https?://.+" },
  },

  RELATION: {
    id: "relation",
    label: "Relation",
    validation: { type: "relation" },
  },
};
