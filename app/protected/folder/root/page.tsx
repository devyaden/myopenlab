"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The "Root" pseudo-folder is gone — uncategorized artifacts now live directly in
 * the Library. Redirect any old bookmark to /protected.
 */
export default function LegacyRootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/protected");
  }, [router]);
  return null;
}
