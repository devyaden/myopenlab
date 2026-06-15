import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === "undefined") return undefined;

        return document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`))
          ?.split("=")[1];
      },
      set(name: string, value: string, options: any) {
        if (typeof document === "undefined") return;

        const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
        document.cookie = `${name}=${value}; Path=/; ${secure} SameSite=Lax; Max-Age=${options?.maxAge || 86400}`;
      },
      remove(name: string) {
        if (typeof document === "undefined") return;

        document.cookie = `${name}=; Path=/; Max-Age=0`;
      },
    },
  }
);

// NOTE: the service-role admin client lives in lib/supabase/admin.ts (server
// only). It must never be imported here — this module is bundled into the
// browser.
