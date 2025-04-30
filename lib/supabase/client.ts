import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`))
          ?.split("=")[1];
      },
      set(name: string, value: string, options: any) {
        const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
        document.cookie = `${name}=${value}; Path=/; ${secure} SameSite=Lax; Max-Age=${options?.maxAge || 86400}`;
      },
      remove(name: string) {
        document.cookie = `${name}=; Path=/; Max-Age=0`;
      },
    },
  }
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);
