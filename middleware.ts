import { type NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const protectedPaths = ['/roadmap', '/feature-request', '/contact', '/'];
  const pathname = request.nextUrl.pathname;

  const isProtected = protectedPaths.includes(pathname);

  const authToken = request.cookies.get('authToken')?.value;

  if (isProtected && !authToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
