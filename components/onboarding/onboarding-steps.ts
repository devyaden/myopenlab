import { ONBOARDING_STEP_IDS } from "@/lib/store/useOnboarding";

/**
 * Single source of truth for the onboarding layer (pure data, no deps).
 * Copy lives in the i18n dictionaries (messages/{en,ar}.json) — this file holds
 * the i18n KEYS plus the structural bits (ids, anchors, icons, sides).
 *
 * Anchors are addressed via [data-onboarding="..."] so they stay stable and
 * Playwright-testable — never via brittle CSS classes.
 */

export const ANCHORS = {
  createNew: "create-new",
  createTiles: "create-tiles",
  surfaceSwitcher: "surface-switcher",
  saveStatus: "save-status",
  askAi: "ask-ai",
} as const;

export type ChecklistCtaKind = "create" | "open-editor" | "ask-ai" | "cmdk";

export interface ChecklistItem {
  id: string;
  titleKey: string;
  descKey: string;
  /** lucide icon key, mapped in getting-started-checklist.tsx */
  icon: string;
  cta?: { labelKey: string; kind: ChecklistCtaKind };
}

const ITEM_CREATE: ChecklistItem = {
  id: ONBOARDING_STEP_IDS.createFirstPlaybook,
  titleKey: "onboarding.checklist.items.create.title",
  descKey: "onboarding.checklist.items.create.desc",
  icon: "plus",
  cta: { labelKey: "onboarding.checklist.items.create.cta", kind: "create" },
};

const ITEM_SURFACES: ChecklistItem = {
  id: ONBOARDING_STEP_IDS.openSurfaces,
  titleKey: "onboarding.checklist.items.surfaces.title",
  descKey: "onboarding.checklist.items.surfaces.desc",
  icon: "layers",
  cta: {
    labelKey: "onboarding.checklist.items.surfaces.cta",
    kind: "open-editor",
  },
};

const ITEM_ASK_AI: ChecklistItem = {
  id: ONBOARDING_STEP_IDS.tryAskAi,
  titleKey: "onboarding.checklist.items.askAi.title",
  descKey: "onboarding.checklist.items.askAi.desc",
  icon: "sparkles",
  cta: { labelKey: "onboarding.checklist.items.askAi.cta", kind: "ask-ai" },
};

const ITEM_EMBED: ChecklistItem = {
  id: ONBOARDING_STEP_IDS.embedLive,
  titleKey: "onboarding.checklist.items.embed.title",
  descKey: "onboarding.checklist.items.embed.desc",
  icon: "blocks",
  cta: { labelKey: "onboarding.checklist.items.embed.cta", kind: "open-editor" },
};

const ITEM_SHARE: ChecklistItem = {
  id: ONBOARDING_STEP_IDS.shareOrInvite,
  titleKey: "onboarding.checklist.items.share.title",
  descKey: "onboarding.checklist.items.share.desc",
  icon: "share-2",
  cta: { labelKey: "onboarding.checklist.items.share.cta", kind: "open-editor" },
};

const ITEM_CMDK: ChecklistItem = {
  id: ONBOARDING_STEP_IDS.tryCmdk,
  titleKey: "onboarding.checklist.items.cmdk.title",
  descKey: "onboarding.checklist.items.cmdk.desc",
  icon: "command",
  cta: { labelKey: "onboarding.checklist.items.cmdk.cta", kind: "cmdk" },
};

/** Solo users don't have teammates to invite — swap Share for the ⌘K power move. */
export function buildChecklist(isSolo: boolean): ChecklistItem[] {
  return [
    ITEM_CREATE,
    ITEM_SURFACES,
    ITEM_ASK_AI,
    ITEM_EMBED,
    isSolo ? ITEM_CMDK : ITEM_SHARE,
  ];
}

export type SpotlightSide = "top" | "bottom" | "left" | "right";

export interface SpotlightStep {
  id: string;
  /** value of the data-onboarding attribute to spotlight */
  anchor: string;
  titleKey: string;
  bodyKey: string;
  side: SpotlightSide;
}

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    id: "create-new",
    anchor: ANCHORS.createNew,
    titleKey: "onboarding.spotlight.steps.createNew.title",
    bodyKey: "onboarding.spotlight.steps.createNew.body",
    side: "bottom",
  },
  {
    id: "create-tiles",
    anchor: ANCHORS.createTiles,
    titleKey: "onboarding.spotlight.steps.tiles.title",
    bodyKey: "onboarding.spotlight.steps.tiles.body",
    side: "top",
  },
  {
    id: "surface-switcher",
    anchor: ANCHORS.surfaceSwitcher,
    titleKey: "onboarding.spotlight.steps.surfaces.title",
    bodyKey: "onboarding.spotlight.steps.surfaces.body",
    side: "bottom",
  },
  {
    id: "ask-ai",
    anchor: ANCHORS.askAi,
    titleKey: "onboarding.spotlight.steps.askAi.title",
    bodyKey: "onboarding.spotlight.steps.askAi.body",
    side: "left",
  },
];

export interface FeatureHintKeys {
  titleKey: string;
  bodyKey: string;
}

/** One-shot coachmarks, keyed by id; fired the first time a surface is reached. */
export const FEATURE_HINTS: Record<string, FeatureHintKeys> = {
  slash: {
    titleKey: "onboarding.hints.slash.title",
    bodyKey: "onboarding.hints.slash.body",
  },
  "canvas-toolbar": {
    titleKey: "onboarding.hints.canvasToolbar.title",
    bodyKey: "onboarding.hints.canvasToolbar.body",
  },
  cmdk: {
    titleKey: "onboarding.hints.cmdk.title",
    bodyKey: "onboarding.hints.cmdk.body",
  },
  references: {
    titleKey: "onboarding.hints.references.title",
    bodyKey: "onboarding.hints.references.body",
  },
};
