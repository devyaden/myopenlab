import "server-only";

import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the SERVICE ROLE key. This MUST never be
// imported from client code: the `server-only` import above turns any such
// import into a build error, and the key is read from a non-`NEXT_PUBLIC_` env
// var so it is never inlined into the browser bundle. Use this exclusively from
// route handlers / server actions (see app/api/admin/users/*).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
