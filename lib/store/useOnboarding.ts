import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useCallback } from "react";
import { supabase } from "../supabase/client";
import { log } from "@/lib/log";

/**
 * Slim onboarding store (Hybrid Spine redesign).
 *
 * Replaces the old react-joyride TUTORIALS engine. State is intentionally tiny:
 * a set of completed Tier-1 checklist step ids + a few flags. Persisted instantly
 * to localStorage and, cross-device, to the EXISTING Supabase columns
 * (`onboarding_data` JSONB + `has_seen_onboarding`) — no DB migration.
 *
 * Legacy data (old `completedTutorials`/`hasSeenWelcome` shape) is read
 * defensively so veterans are neither re-onboarded nor errored on hydrate.
 */

// Canonical Tier-1 checklist step ids — kept in sync with onboarding-steps.ts.
export const ONBOARDING_STEP_IDS = {
  createFirstPlaybook: "create-first-playbook",
  openSurfaces: "open-3-surfaces",
  tryAskAi: "try-ask-ai",
  embedLive: "embed-live-content",
  shareOrInvite: "share-or-invite",
  tryCmdk: "try-cmdk",
} as const;

export type OnboardingStepId =
  (typeof ONBOARDING_STEP_IDS)[keyof typeof ONBOARDING_STEP_IDS];

interface OnboardingState {
  // ---- Persisted progress ----
  completedStepIds: string[];
  seenHints: Record<string, boolean>;
  welcomeSeen: boolean;
  dismissedChecklist: boolean;
  teamSize: string | null;
  firstProcess: string | null;
  lastSyncAt: string | null;

  // ---- Session-only (not persisted) ----
  isHydrated: boolean;
  isSyncing: boolean;
  spotlightActive: boolean;
  spotlightStep: number;

  // ---- Actions ----
  completeStep: (id: string) => void;
  markHintSeen: (id: string) => void;
  setWelcomeSeen: () => void;
  dismissChecklist: () => void;
  reopenChecklist: () => void;
  setPersona: (p: { teamSize?: string | null; firstProcess?: string | null }) => void;
  startSpotlight: () => void;
  stopSpotlight: () => void;
  setSpotlightStep: (n: number) => void;
  setHydrated: (b: boolean) => void;
  resetOnboarding: () => void;

  // ---- Getters ----
  isStepComplete: (id: string) => boolean;
  isHintSeen: (id: string) => boolean;

  // ---- Database sync ----
  syncWithDatabase: (userId: string, force?: boolean) => Promise<void>;
  saveToDatabase: (userId: string) => Promise<void>;
}

// Debounced background save to Supabase using the globally-stashed user id.
function scheduleSave(get: () => OnboardingState) {
  if (typeof window === "undefined") return;
  const uid = (window as any).currentUserId;
  if (!uid) return;
  clearTimeout((window as any).onboardingSaveTimeout);
  (window as any).onboardingSaveTimeout = setTimeout(() => {
    get()
      .saveToDatabase(uid)
      .catch((e) => console.error("onboarding save failed", e));
  }, 1200);
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      completedStepIds: [],
      seenHints: {},
      welcomeSeen: false,
      dismissedChecklist: false,
      teamSize: null,
      firstProcess: null,
      lastSyncAt: null,

      isHydrated: false,
      isSyncing: false,
      spotlightActive: false,
      spotlightStep: 0,

      // Actions
      completeStep: (id) => {
        const state = get();
        if (state.completedStepIds.includes(id)) return;
        set({ completedStepIds: [...state.completedStepIds, id] });
        scheduleSave(get);
      },

      markHintSeen: (id) => {
        const state = get();
        if (state.seenHints[id]) return;
        set({ seenHints: { ...state.seenHints, [id]: true } });
        scheduleSave(get);
      },

      setWelcomeSeen: () => {
        if (get().welcomeSeen) return;
        set({ welcomeSeen: true });
        scheduleSave(get);
      },

      dismissChecklist: () => {
        set({ dismissedChecklist: true });
        scheduleSave(get);
      },

      reopenChecklist: () => {
        set({ dismissedChecklist: false });
        scheduleSave(get);
      },

      setPersona: ({ teamSize, firstProcess }) => {
        set({
          teamSize: teamSize ?? get().teamSize,
          firstProcess: firstProcess ?? get().firstProcess,
        });
        scheduleSave(get);
      },

      startSpotlight: () => set({ spotlightActive: true, spotlightStep: 0 }),
      stopSpotlight: () => set({ spotlightActive: false, spotlightStep: 0 }),
      setSpotlightStep: (n) => set({ spotlightStep: n }),

      setHydrated: (b) => set({ isHydrated: b }),

      resetOnboarding: () =>
        set({
          completedStepIds: [],
          seenHints: {},
          dismissedChecklist: false,
          spotlightActive: false,
          spotlightStep: 0,
        }),

      // Getters
      isStepComplete: (id) => get().completedStepIds.includes(id),
      isHintSeen: (id) => !!get().seenHints[id],

      // Database sync — merge DB <-> local, tolerant of the legacy shape.
      syncWithDatabase: async (userId, force = false) => {
        const state = get();
        if (state.isSyncing && !force) return;

        const lastSync = state.lastSyncAt
          ? new Date(state.lastSyncAt).getTime()
          : 0;
        const fiveMinutes = 5 * 60 * 1000;
        if (!force && Date.now() - lastSync < fiveMinutes) return;

        set({ isSyncing: true });
        try {
          const { data: userData } = await supabase
            .from("user")
            .select("onboarding_data, has_seen_onboarding")
            .eq("id", userId)
            .single();

          const raw = userData?.onboarding_data;
          const db: Record<string, any> = raw
            ? typeof raw === "string"
              ? safeParse(raw)
              : raw
            : {};

          // Legacy veterans engaged with the old tutorial engine — don't re-onboard.
          const legacyEngaged =
            (Array.isArray(db.completedTutorials) &&
              db.completedTutorials.length > 0) ||
            db.hasSeenWelcome === true;

          const dbWelcomeSeen =
            typeof db.welcomeSeen === "boolean"
              ? db.welcomeSeen
              : !!userData?.has_seen_onboarding || legacyEngaged;

          const merged = {
            completedStepIds: Array.from(
              new Set([
                ...state.completedStepIds,
                ...(Array.isArray(db.completedStepIds)
                  ? db.completedStepIds
                  : []),
              ])
            ),
            seenHints: {
              ...(db.seenHints && typeof db.seenHints === "object"
                ? db.seenHints
                : {}),
              ...state.seenHints,
            },
            welcomeSeen: state.welcomeSeen || dbWelcomeSeen,
            dismissedChecklist:
              state.dismissedChecklist ||
              (typeof db.dismissedChecklist === "boolean"
                ? db.dismissedChecklist
                : false),
            teamSize: state.teamSize ?? db.teamSize ?? null,
            firstProcess: state.firstProcess ?? db.firstProcess ?? null,
          };

          set({ ...merged, lastSyncAt: new Date().toISOString() });
          await get().saveToDatabase(userId);
        } catch (error) {
          console.error("Failed to sync onboarding data:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Persist to Supabase, preserving any unknown keys already in onboarding_data
      // (e.g. the signup questionnaire's companyDescription).
      saveToDatabase: async (userId) => {
        try {
          const state = get();
          const { data } = await supabase
            .from("user")
            .select("onboarding_data")
            .eq("id", userId)
            .single();

          const existing: Record<string, any> = data?.onboarding_data
            ? typeof data.onboarding_data === "string"
              ? safeParse(data.onboarding_data)
              : data.onboarding_data
            : {};

          const dataToSave = {
            ...existing,
            completedStepIds: state.completedStepIds,
            seenHints: state.seenHints,
            welcomeSeen: state.welcomeSeen,
            dismissedChecklist: state.dismissedChecklist,
            teamSize: state.teamSize ?? existing.teamSize ?? null,
            firstProcess: state.firstProcess ?? existing.firstProcess ?? null,
          };

          await supabase
            .from("user")
            .update({
              onboarding_data: dataToSave,
              has_seen_onboarding: state.welcomeSeen,
            })
            .eq("id", userId);

          log.debug("Onboarding data saved to database");
        } catch (error) {
          console.error("Failed to save onboarding data to database:", error);
        }
      },
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        completedStepIds: state.completedStepIds,
        seenHints: state.seenHints,
        welcomeSeen: state.welcomeSeen,
        dismissedChecklist: state.dismissedChecklist,
        teamSize: state.teamSize,
        firstProcess: state.firstProcess,
        lastSyncAt: state.lastSyncAt,
      }),
      // Tolerant merge: map any legacy localStorage shape onto the slim schema.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as any;
        const legacyWelcome =
          p.welcomeSeen === true ||
          p.hasSeenWelcome === true ||
          (Array.isArray(p.completedTutorials) &&
            p.completedTutorials.length > 0);
        return {
          ...current,
          completedStepIds: Array.isArray(p.completedStepIds)
            ? p.completedStepIds
            : [],
          seenHints:
            p.seenHints && typeof p.seenHints === "object" ? p.seenHints : {},
          welcomeSeen:
            typeof p.welcomeSeen === "boolean" ? p.welcomeSeen : legacyWelcome,
          dismissedChecklist:
            typeof p.dismissedChecklist === "boolean"
              ? p.dismissedChecklist
              : false,
          teamSize: p.teamSize ?? null,
          firstProcess: p.firstProcess ?? null,
          lastSyncAt: p.lastSyncAt ?? null,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);

function safeParse(s: string): Record<string, any> {
  try {
    return JSON.parse(s) ?? {};
  } catch {
    return {};
  }
}

/**
 * Backwards-compatible hook for the dashboard surfaces that still call the old
 * `track*` helpers. `trackCreate` now completes the "create your first playbook"
 * checklist item; folder/search tracking are no-ops (those were only feeding the
 * removed "smart suggestion" engine).
 */
export function useOnboarding() {
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const trackCreate = useCallback(
    () => completeStep(ONBOARDING_STEP_IDS.createFirstPlaybook),
    [completeStep]
  );
  const noop = useCallback(() => {}, []);
  return { trackCreate, trackFolderCreate: noop, trackSearch: noop };
}
