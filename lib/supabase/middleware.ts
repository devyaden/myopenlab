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
            // Add secure: false for local development
            response.cookies.set({
              name,
              value,
              ...options,
              secure: process.env.NODE_ENV === "production",
              path: "/",
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: "",
              ...options,
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 0,
            });
          },
        },
      }
    );

    // Get authenticated user data using getUser instead of getSession for security
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // More detailed debugging
    if (!user || userError) {
      console.log("No authenticated user available in middleware");

      // Only redirect to auth for protected routes, allow auth page to load
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/protected")) {
        return redirectToAuth(request);
      }
      return response;
    }

    // Check path information
    const { pathname } = request.nextUrl;
    const isAuthenticated = !!user;
    const isUserRoute = pathname.startsWith("/protected");
    const isRootRoute = pathname === "/";
    const isAuthRoute =
      pathname === "/auth/signup" ||
      pathname === "/auth/login" ||
      pathname === "/forgot-password";

    // If user is not authenticated and trying to access protected routes
    if (!isAuthenticated && isUserRoute) {
      return redirectToAuth(request);
    }

    // If user is authenticated and trying to access auth page
    if (isAuthenticated && isAuthRoute) {
      return redirectToHome(request);
    }

    // If authenticated user is on root, redirect to protected
    if (isAuthenticated && isRootRoute) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // In case of error, only redirect for protected routes
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/protected")) {
      return redirectToAuth(request);
    }

    // For other routes, continue normally to prevent redirect loops
    return NextResponse.next();
  }
};

// Helper functions for redirects
const redirectToAuth = (request: NextRequest) => {
  return NextResponse.redirect(new URL("/auth/login", request.url));
};
const redirectToHome = (request: NextRequest) => {
  return NextResponse.redirect(new URL("/", request.url));
};
