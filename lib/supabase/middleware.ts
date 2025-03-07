import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create the initial response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Initialize Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    // Refresh session if expired - required for Server Components
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If auth error, just pass through
    if (authError) {
      console.error("Auth error:", authError);
      return response;
    }

    // Check path information
    const { pathname } = request.nextUrl;
    const isAuthenticated = !!user;
    const isAdminRoute = pathname.startsWith("/admin");
    const isUserRoute = pathname.startsWith("/protected");
    const isRootRoute = pathname === "/";

    // Only fetch database user if we need role information and user is authenticated
    let userRole = null;
    if (isAuthenticated && (isAdminRoute || isUserRoute || isRootRoute)) {
      const { data: databaseUser, error: dbUserError } = await supabase
        .from("user")
        .select("role")
        .eq("id", user.id)
        .single();

      if (dbUserError) {
        console.error("Database user error:", dbUserError);
        return response;
      }

      userRole = databaseUser?.role; // admin | user
    }

    // Handle routing based on authentication and role
    if (!isAuthenticated) {
      // Redirect unauthenticated users trying to access protected routes
      if (isAdminRoute || isUserRoute) {
        return NextResponse.redirect(new URL("/authentication", request.url));
      }
    } else {
      // User is authenticated, handle role-based redirects
      if (userRole === "admin") {
        if (isUserRoute || isRootRoute) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } else if (userRole === "user") {
        if (isAdminRoute) {
          return NextResponse.redirect(new URL("/protected", request.url));
        }
        if (isRootRoute) {
          return NextResponse.redirect(new URL("/protected", request.url));
        }
      }
    }

    return response;
  } catch (e) {
    console.error("Supabase client creation failed:", e);
    // Return a default response if Supabase client couldn't be created
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
