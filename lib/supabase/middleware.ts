import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user = await supabase.auth.getUser();
    const { data: databaseUser, error } = await supabase
      .from("user")
      .select()
      .eq("id", user?.data?.user?.id)
      .single();

    if (error) {
      console.log("🚀 ~ updateSession ~ error", error);
      return NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
    }

    const userRole = databaseUser?.role; // this can be admin | user

    const isAuthenticated = user && !user.error;
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    const isUserRoute = request.nextUrl.pathname.startsWith("/protected");

    // protected routes
    if (isUserRoute && user.error) {
      return NextResponse.redirect(new URL("/authentication", request.url));
    }

    if (isAdminRoute && user.error) {
      return NextResponse.redirect(new URL("/authentication", request.url));
    }

    if (isAdminRoute && userRole === "user") {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    if (isUserRoute && userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (
      request.nextUrl.pathname === "/" &&
      !user.error &&
      userRole === "user"
    ) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    if (
      request.nextUrl.pathname === "/" &&
      !user.error &&
      userRole === "admin"
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
