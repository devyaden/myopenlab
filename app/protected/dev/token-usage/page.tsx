"use client";

import { Fragment, useEffect, useState } from "react";

// Dev-only token-usage report. Per user: today / this-month / last-30-days billable
// tokens next to their daily + monthly caps, so you can tell whether the limits are
// too high (everyone far under) or too low (people pegged at 100%). Reads the live
// ai_token_usage log; since dev + prod share one DB, these are the real numbers.

interface DayPoint {
  day: string;
  billable: number;
}
interface UserRow {
  userId: string;
  email: string | null;
  today: number;
  month: number;
  last30: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyPct: number | null;
  monthlyPct: number | null;
  days: DayPoint[];
}
interface Report {
  generatedAt: string;
  today: string;
  monthPrefix: string;
  totals: { today: number; month: number; last30: number; activeUsers: number };
  users: UserRow[];
}

const fmt = (n: number) => n.toLocaleString();

function Pct({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const cls =
    value >= 90 ? "text-destructive" : value >= 60 ? "text-amber-600" : "text-muted-foreground";
  return <span className={cls}>{value}%</span>;
}

export default function TokenUsagePage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/token-usage")
      .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.json())))
      .then(setReport)
      .catch((e) => setError(e?.error || "Failed to load"));
  }, []);

  if (error)
    return <div className="p-6 text-sm text-destructive">Error: {error}</div>;
  if (!report) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div dir="ltr" className="p-6 text-sm">
      <h1 className="mb-1 text-lg font-semibold">AI token usage (dev)</h1>
      <p className="mb-4 text-xs text-muted-foreground">
        Billable tokens. {report.totals.activeUsers} active user(s) · today{" "}
        {fmt(report.totals.today)} · this month {fmt(report.totals.month)} · last 30d{" "}
        {fmt(report.totals.last30)}. Generated {new Date(report.generatedAt).toLocaleString()}.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2 text-right">Today</th>
              <th className="px-3 py-2 text-right">Daily cap</th>
              <th className="px-3 py-2 text-right">Day %</th>
              <th className="px-3 py-2 text-right">This month</th>
              <th className="px-3 py-2 text-right">Monthly cap</th>
              <th className="px-3 py-2 text-right">Mo %</th>
              <th className="px-3 py-2 text-right">Last 30d</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {report.users.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-muted-foreground">
                  No usage recorded yet.
                </td>
              </tr>
            )}
            {report.users.map((u) => (
              <Fragment key={u.userId}>
                <tr className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{u.email ?? "(no email)"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{u.userId}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(u.today)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmt(u.dailyLimit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums"><Pct value={u.dailyPct} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(u.month)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmt(u.monthlyLimit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums"><Pct value={u.monthlyPct} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(u.last30)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setExpanded(expanded === u.userId ? null : u.userId)}
                    >
                      {expanded === u.userId ? "hide" : "days"}
                    </button>
                  </td>
                </tr>
                {expanded === u.userId && (
                  <tr className="border-t bg-muted/20">
                    <td colSpan={9} className="px-3 py-2">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
                        {u.days.map((d) => (
                          <span key={d.day}>
                            {d.day}: {fmt(d.billable)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
