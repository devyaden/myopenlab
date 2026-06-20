import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import type { Locale } from "./config";

// Both dictionaries are bundled client-side (they are tiny) so toggling the
// language is instant — no server round-trip. `en` is the authoritative shape.
export type Messages = typeof en;

export const MESSAGES: Record<Locale, Messages> = {
  en,
  ar: ar as Messages,
};
