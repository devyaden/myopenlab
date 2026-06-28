"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ArrowRight, Sparkles, Check, Compass } from "lucide-react";
import { useOnboardingStore, ONBOARDING_STEP_IDS } from "@/lib/store/useOnboarding";

const TEAM_SIZES = ["Just me", "2–10", "11–50", "51–200"];
const PROCESS_SUGGESTIONS = [
  "Hiring & onboarding",
  "Vendor onboarding",
  "Incident response",
  "Sales handoff",
  "Customer onboarding",
];

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js").then((m) => m.default?.capture?.(event, props)).catch(() => {});
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [firstProcess, setFirstProcess] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seededName, setSeededName] = useState<string | null>(null);

  // If the visitor built a playbook on /try, save it into their new account.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("olab_demo_playbook");
    } catch {
      return;
    }
    if (!raw) return;
    (async () => {
      try {
        const demo = JSON.parse(raw);
        const name = (demo.prompt || "My first playbook").slice(0, 60);
        const res = await fetch("/api/ai/agent/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "create",
            name,
            diagram: {
              nodes: demo.nodes ?? [],
              edges: demo.edges ?? [],
              nodeStyles: demo.styles ?? {},
            },
          }),
        });
        if (res.ok) {
          setSeededName(name);
          capture("try.seeded_on_signup");
        }
      } catch {
        // ignore
      } finally {
        try {
          localStorage.removeItem("olab_demo_playbook");
        } catch {}
      }
    })();
  }, []);

  const generate = useCallback(async () => {
    setStep(4);
    setError(null);
    capture("onboarding.generate_started", { teamSize });
    try {
      const res = await fetch("/api/onboarding/generate-starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyDescription: company.trim(),
          teamSize,
          firstProcess: firstProcess.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setStep(3);
        return;
      }
      capture("onboarding.completed");
      // The AI just created the user's first playbook — record persona + progress
      // so the in-app checklist shows item 1 pre-checked on the dashboard.
      const onboarding = useOnboardingStore.getState();
      onboarding.setPersona({ teamSize, firstProcess });
      onboarding.setWelcomeSeen();
      onboarding.completeStep(ONBOARDING_STEP_IDS.createFirstPlaybook);
      router.push(`/protected/playbook/${json.canvasId}`);
    } catch {
      setError("Network error. Please try again.");
      setStep(3);
    }
  }, [company, teamSize, firstProcess, router]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* brand bar */}
      <div className="flex items-center justify-between px-6 py-5 lg:px-10">
        <Image
          src="/assets/global/app-logo.svg"
          alt="Olab"
          width={92}
          height={28}
          className="h-7 w-auto dark:hidden"
          priority
        />
        <Image
          src="/assets/global/app-logo-white.svg"
          alt="Olab"
          width={92}
          height={28}
          className="hidden h-7 w-auto dark:block"
          priority
        />
        {step < 4 && (
          <button
            onClick={() => router.push("/protected")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl">
          {/* eyebrow */}
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Compass className="h-4 w-4 text-signal" />
            Set up your atlas
          </div>

          {seededName && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-signal/30 bg-signal/10 px-4 py-3 text-sm">
              <Check size={16} className="text-signal" />
              <span>
                We saved the playbook you started:{" "}
                <strong className="font-semibold">{seededName}</strong>
              </span>
            </div>
          )}

          {/* step progress (wayfinding: you always know where you are) */}
          {step < 4 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Step {step} of 3</span>
                <span>
                  {step === 1 ? "About you" : step === 2 ? "Your team" : "First process"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-signal transition-all duration-menu"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-atlas-sm md:p-8">
            {step === 1 && (
              <Step
                title="What does your company do?"
                hint="One or two sentences is plenty — it helps the AI build playbooks that fit you."
              >
                <textarea
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="e.g. We're a 40-person B2B SaaS company selling analytics to retailers."
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
                <NextButton
                  disabled={company.trim().length < 2}
                  onClick={() => setStep(2)}
                />
              </Step>
            )}

            {step === 2 && (
              <Step title="How big is your team?" hint="">
                <div className="grid grid-cols-2 gap-3">
                  {TEAM_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setTeamSize(s);
                        setStep(3);
                      }}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        teamSize === s
                          ? "border-signal bg-signal/10 text-foreground"
                          : "border-border hover:border-signal/60 hover:bg-accent"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step
                title="What's the first process you want to capture?"
                hint="Pick one — you can add more later."
              >
                <input
                  value={firstProcess}
                  onChange={(e) => setFirstProcess(e.target.value)}
                  autoFocus
                  placeholder="e.g. How we onboard a new customer"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {PROCESS_SUGGESTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setFirstProcess(p)}
                      className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-signal/60 hover:text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                <button
                  onClick={generate}
                  disabled={firstProcess.trim().length < 2}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-yadn-accent-green px-4 py-3 font-medium text-white transition-colors hover:bg-yadn-accent-green/90 disabled:opacity-50"
                >
                  <Sparkles size={18} /> Build my first playbook
                </button>
              </Step>
            )}

            {step === 4 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-signal/10">
                  <Loader2 size={28} className="animate-spin text-signal" />
                </div>
                <p className="font-display text-lg font-semibold">
                  Drawing your first playbook…
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Turning &ldquo;{firstProcess}&rdquo; into a living map of the process.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function NextButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-5 flex items-center justify-center gap-2 rounded-md bg-yadn-accent-green px-5 py-2.5 font-medium text-white transition-colors hover:bg-yadn-accent-green/90 disabled:opacity-50"
    >
      Continue <ArrowRight size={16} className="rtl:rotate-180" />
    </button>
  );
}
