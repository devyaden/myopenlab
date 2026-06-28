import { Compass } from "lucide-react";

/**
 * The Atlas signature for the auth entry: the product's thesis made literal — a
 * company's processes drawn as a small connected MAP, each carrying its code
 * "coordinate", with a "you are here" marker. Intentionally a fixed dark brand
 * surface (the same in light/dark), more expressive than the in-app chrome.
 */
const NODES = [
  { code: "HR-01", label: "Recruitment & Sourcing", meta: "Flow · RACI · Policies", current: false },
  { code: "HR-02", label: "Onboarding", meta: "Flow · Checklist · Templates", current: true },
  { code: "HR-03", label: "Performance Reviews", meta: "Flow · Authority matrix", current: false },
];

export function AtlasAuthAside() {
  return (
    <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0A0E13] p-12 text-white lg:p-14 md:flex">
      {/* map paper — faint dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* teal route glow */}
      <div
        aria-hidden
        className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#0E7C71]/25 blur-[110px]"
      />
      <div
        aria-hidden
        className="absolute -left-24 bottom-8 h-72 w-72 rounded-full bg-[#15B8A4]/10 blur-[90px]"
      />

      {/* eyebrow */}
      <div className="relative z-10 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
        <Compass className="h-4 w-4 text-[#15B8A4]" />
        The operating-model atlas
      </div>

      {/* the constellation — a connected chain of coded processes */}
      <div className="relative z-10">
        {NODES.map((n, i) => (
          <div key={n.code} className="flex items-stretch gap-4">
            <div className="flex flex-col items-center pt-1.5">
              <span
                className={
                  n.current
                    ? "h-3 w-3 rounded-full bg-[#E0930C] ring-4 ring-[#E0930C]/20"
                    : "h-2.5 w-2.5 rounded-full bg-[#15B8A4]"
                }
              />
              {i < NODES.length - 1 && (
                <span className="my-1 w-px flex-1 bg-gradient-to-b from-[#15B8A4]/60 to-[#15B8A4]/15" />
              )}
            </div>
            <div className="mb-4 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white/90">
                  {n.label}
                </span>
                <span
                  dir="ltr"
                  className="rounded-sm bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#5fe8d6]"
                >
                  {n.code}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/45">{n.meta}</p>
              {n.current && (
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#f2b85a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E0930C]" />
                  you are here
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* tagline */}
      <div className="relative z-10 max-w-md">
        <p className="font-display text-[2rem] font-semibold leading-[1.15] tracking-tight">
          The living map of how your company runs.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Every process, policy, and team — captured once and kept in sync, with
          an AI assistant that keeps the whole atlas connected.
        </p>
      </div>
    </aside>
  );
}

export default AtlasAuthAside;
