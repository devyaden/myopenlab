import { redirect } from "next/navigation";
import { requireExploreAccess } from "@/lib/explore/access";

// The standalone exploration route. Global providers (theme, locale/RTL, user,
// toaster) come from the root layout; this layout deliberately adds NO editor
// chrome (no sidebar / command palette / agent), so a future explorer-only role
// can use it without the editing app loading. This is also the single route-level
// access gate — when roles ship, canEnterExplore in lib/explore/access decides who
// reaches here, and the middleware routes explorer-only users to /explore.
export default async function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireExploreAccess();
  if (!access.ok) {
    redirect(access.status === 403 ? "/protected" : "/auth/login");
  }
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
