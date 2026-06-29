"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { LibraryHome } from "@/components/dashboard/library-home";
import { FeedbackPrompt } from "@/components/feedback/FeedbackPrompt";

export default function Dashboard() {
  return (
    <>
      <AppShell>
        <Suspense fallback={null}>
          <LibraryHome />
        </Suspense>
      </AppShell>
      <FeedbackPrompt />
    </>
  );
}
