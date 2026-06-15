"use client";

import { useEffect, useState } from "react";
import { X, MessageSquarePlus } from "lucide-react";

// Lightweight, dismissible in-product prompt that asks engaged users what's
// missing. Captured to PostHog as `feedback.submitted`. Shows once per browser
// until answered or dismissed (localStorage flag).
const STORAGE_KEY = "olab_feedback_prompt_seen";
// Set NEXT_PUBLIC_CAL_URL to your Cal.com link to enable the "book a call" CTA.
const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL;

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  import("posthog-js").then((m) => m.default?.capture?.(event, props)).catch(() => {});
}

export function FeedbackPrompt() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Delay so it doesn't fight with first-load.
        const t = setTimeout(() => setVisible(true), 20000);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  const submit = () => {
    if (text.trim().length < 2) return;
    capture("feedback.submitted", { text: text.trim() });
    setSubmitted(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setTimeout(() => setVisible(false), 1800);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 w-[320px] rounded-xl border bg-background p-4 shadow-xl">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={16} className="text-primary" />
          <span className="text-sm font-medium">Quick question</span>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
      {submitted ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Thank you — noted! 🙏</p>
          {CAL_URL && (
            <a
              href={CAL_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => capture("book_call.clicked", { from: "feedback_thanks" })}
              className="block text-sm font-medium text-primary hover:underline"
            >
              Want to talk? Book a 15-min call →
            </a>
          )}
        </div>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">
            What&apos;s the #1 thing missing for this to be useful to you?
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Type anything…"
            className="w-full resize-none rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={submit}
            disabled={text.trim().length < 2}
            className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
          {CAL_URL && (
            <a
              href={CAL_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => capture("book_call.clicked", { from: "feedback_prompt" })}
              className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              or book a 15-min call →
            </a>
          )}
        </>
      )}
    </div>
  );
}
