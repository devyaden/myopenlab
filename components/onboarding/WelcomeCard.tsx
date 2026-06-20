"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/userContext";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useT } from "@/lib/i18n/LocaleProvider";

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js")
    .then((m) => m.default?.capture?.(event, props))
    .catch(() => {});
}

/**
 * A single, calm first-run welcome. Shows once on the dashboard for a brand-new
 * user (`welcomeSeen === false`) and offers a clear fork — nothing auto-plays.
 * Replaces the old emoji/gradient WelcomeDialog (and its dead autoStartTutorials gate).
 */
export const WelcomeCard: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const {
    welcomeSeen,
    isHydrated,
    setWelcomeSeen,
    startSpotlight,
    reopenChecklist,
  } = useOnboardingStore();
  const t = useT();

  useEffect(() => {
    if (!user || !isHydrated) return;
    if (welcomeSeen) return;
    if (pathname !== "/protected") return;
    setOpen(true);
    capture("onboarding.welcome_shown");
  }, [user, isHydrated, welcomeSeen, pathname]);

  const finish = (choice: string) => {
    capture("onboarding.welcome_choice", { choice });
    setWelcomeSeen();
    setOpen(false);
  };

  const buildWithAI = () => {
    finish("build_with_ai");
    router.push("/onboarding");
  };

  const showAround = () => {
    reopenChecklist();
    finish("show_me_around");
    // Let the dialog unmount before the spotlight measures anchors.
    setTimeout(() => startSpotlight(), 250);
  };

  if (!open || !user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish("dismiss")}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-yadn-accent-green/10">
            <Sparkles size={18} className="text-yadn-accent-green" />
          </div>
          <DialogTitle className="text-xl">
            {t("onboarding.welcome.title")}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {t("onboarding.welcome.body")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2">
          <Button
            onClick={buildWithAI}
            className="w-full justify-between bg-yadn-accent-green text-white hover:bg-yadn-accent-green/90"
          >
            {t("onboarding.welcome.buildWithAI")}
            <ArrowRight size={16} className="shrink-0 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            onClick={showAround}
            className="w-full justify-center"
          >
            {t("onboarding.welcome.showAround")}
          </Button>
          <button
            onClick={() => finish("skip")}
            className="mt-1 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.welcome.skip")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeCard;
