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
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Get session and refresh if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return redirectToAuth(request);
    }

    // Check path information
    const { pathname } = request.nextUrl;
    const isAuthenticated = !!session?.user;
    const isAdminRoute = pathname.startsWith("/admin");
    const isUserRoute = pathname.startsWith("/protected");
    const isRootRoute = pathname === "/";
    const isAuthRoute = pathname === "/authentication";

    // If user is not authenticated and trying to access protected routes
    if (!isAuthenticated && (isAdminRoute || isUserRoute)) {
      return redirectToAuth(request);
    }

    // If user is authenticated and trying to access auth page
    if (isAuthenticated && isAuthRoute) {
      return redirectToHome(request);
    }

    // Only fetch user role if needed and user is authenticated
    if (isAuthenticated && (isAdminRoute || isUserRoute || isRootRoute)) {
      const { data: userRole, error: roleError } = await supabase
        .from("user")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (roleError) {
        console.error("Role fetch error:", roleError);
        return redirectToAuth(request);
      }

      // Handle role-based access
      if (userRole?.role === "admin") {
        if (isUserRoute || isRootRoute) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } else if (userRole?.role === "user") {
        if (isAdminRoute) {
          return NextResponse.redirect(new URL("/protected", request.url));
        }
        if (isRootRoute) {
          return NextResponse.redirect(new URL("/protected", request.url));
        }
      } else {
        // Invalid role
        return redirectToAuth(request);
      }
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return redirectToAuth(request);
  }
};

// Helper functions for redirects
const redirectToAuth = (request: NextRequest) => {
  return NextResponse.redirect(new URL("/authentication", request.url));
};

const redirectToHome = (request: NextRequest) => {
  return NextResponse.redirect(new URL("/", request.url));
};
