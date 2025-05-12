// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import {
//   SubscriptionFeatureFlag,
//   hasFeatureAccess,
//   getFeatureLimit,
// } from "@/lib/subscription-features";

// const supabase = createClient();

// // Paths that should check for subscription access
// const PROTECTED_FEATURE_PATHS = [
//   // Export paths
//   {
//     path: /^\/api\/export\/.*$/,
//     feature: SubscriptionFeatureFlag.ALLOW_EXPORT,
//   },
//   // AI feature paths
//   {
//     path: /^\/api\/ai\/.*$/,
//     feature: SubscriptionFeatureFlag.ALLOW_AI_FEATURES,
//   },
//   // Custom theme paths
//   {
//     path: /^\/api\/themes\/custom.*$/,
//     feature: SubscriptionFeatureFlag.ALLOW_CUSTOM_THEMES,
//   },
//   // Sharing paths
//   {
//     path: /^\/api\/share\/private.*$/,
//     feature: SubscriptionFeatureFlag.ALLOW_PRIVATE_SHARING,
//   },
//   {
//     path: /^\/api\/share\/public.*$/,
//     feature: SubscriptionFeatureFlag.ALLOW_PUBLIC_SHARING,
//   },
// ];

// /**
//  * Check if a user has access to certain features based on their subscription
//  */
// export async function middleware(request: NextRequest) {

//   // Skip middleware for non-API routes or non-protected paths
//   const isProtectedPath = PROTECTED_FEATURE_PATHS.some(({ path }) =>
//     path.test(request.nextUrl.pathname)
//   );

//   if (!isProtectedPath) {
//     return NextResponse.next();
//   }

//   try {
//     // Get authenticated user from session
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const token = authHeader.replace("Bearer ", "");
//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser(token);

//     if (error || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Check which feature is being accessed
//     const accessedFeature = PROTECTED_FEATURE_PATHS.find(({ path }) =>
//       path.test(request.nextUrl.pathname)
//     );

//     if (accessedFeature) {
//       const hasAccess = await hasFeatureAccess(
//         user.id,
//         accessedFeature.feature
//       );

//       if (!hasAccess) {
//         return NextResponse.json(
//           {
//             error: "Subscription required",
//             message: "Your current subscription does not include this feature",
//           },
//           { status: 403 }
//         );
//       }
//     }

//     // For diagram creation, check MAX_DIAGRAMS limit
//     if (
//       request.nextUrl.pathname === "/api/canvas" &&
//       request.method === "POST"
//     ) {
//       const currentDiagramCount = await getCurrentDiagramCount(user.id);
//       const maxDiagrams = await getFeatureLimit(
//         user.id,
//         SubscriptionFeatureFlag.MAX_DIAGRAMS
//       );

//       if (currentDiagramCount >= maxDiagrams) {
//         return NextResponse.json(
//           {
//             error: "Limit reached",
//             message: `You have reached the maximum number of diagrams (${maxDiagrams}) for your subscription`,
//           },
//           { status: 403 }
//         );
//       }
//     }

//     // For collaborator invites, check MAX_COLLABORATORS limit
//     if (
//       request.nextUrl.pathname.startsWith("/api/canvas/") &&
//       request.nextUrl.pathname.includes("/share") &&
//       request.method === "POST"
//     ) {
//       // Extract canvas ID from the URL
//       const canvasId = request.nextUrl.pathname.split("/")[3];
//       const currentCollaboratorCount =
//         await getCurrentCollaboratorCount(canvasId);
//       const maxCollaborators = await getFeatureLimit(
//         user.id,
//         SubscriptionFeatureFlag.MAX_COLLABORATORS
//       );

//       if (currentCollaboratorCount >= maxCollaborators) {
//         return NextResponse.json(
//           {
//             error: "Limit reached",
//             message: `You have reached the maximum number of collaborators (${maxCollaborators}) for your subscription`,
//           },
//           { status: 403 }
//         );
//       }
//     }

//     return NextResponse.next();
//   } catch (error) {
//     console.error("Error in subscription middleware:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * Get the current number of diagrams for a user
//  */
// async function getCurrentDiagramCount(userId: string): Promise<number> {
//   const { count, error } = await supabase
//     .from("canvas")
//     .select("*", { count: "exact" })
//     .eq("user_id", userId);

//   if (error) {
//     console.error("Error counting user diagrams:", error);
//     return 0;
//   }

//   return count || 0;
// }

// /**
//  * Get the current number of collaborators for a canvas
//  */
// async function getCurrentCollaboratorCount(canvasId: string): Promise<number> {
//   const { count, error } = await supabase
//     .from("canvas_share")
//     .select("*", { count: "exact" })
//     .eq("canvas_id", canvasId);

//   if (error) {
//     console.error("Error counting canvas collaborators:", error);
//     return 0;
//   }

//   return count || 0;
// }

// export const config = {
//   matcher: ["/api/:path*"],
// };
