"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandBarTrigger } from "@/components/command-palette/CommandBarTrigger";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useUser } from "@/lib/contexts/userContext";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { useT } from "@/lib/i18n/LocaleProvider";
import { STORAGE_URL } from "@/utils/constants";
import { ChevronRight, Compass, Crown, LogOut, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * The Atlas top bar — one cohesive chrome strip on every Library/Collection
 * surface: sidebar toggle + locator breadcrumb on the left, the single ⌘K command
 * bar in the centre (the only search anywhere), and theme / language / account on
 * the right. Replaces the legacy dark header-dashboard; uses Atlas tokens so it
 * themes in light + dark.
 */
export function TopBar() {
  const { signOut, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { folders } = useSidebarStore();
  const { reopenChecklist, startSpotlight } = useOnboardingStore();
  const t = useT();

  const avatarUrl = STORAGE_URL + `avatars/` + user?.avatar_url;

  // Locator: Library, plus the Collection name when inside one (no "Root").
  const folderId = pathname?.startsWith("/protected/folder/")
    ? pathname.split("/")[3]
    : null;
  const collection = folderId ? folders.find((f) => f.id === folderId) : null;

  const handleGetStarted = () => {
    reopenChecklist();
    if (pathname !== "/protected") {
      router.push("/protected");
      setTimeout(() => startSpotlight(), 500);
    } else {
      startSpotlight();
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <SidebarTrigger className="text-muted-foreground" />

      <nav
        className="flex min-w-0 items-center gap-1.5 text-sm"
        aria-label="Location"
      >
        <Link
          href="/protected"
          className="shrink-0 rounded px-1.5 py-0.5 font-medium text-foreground transition-colors hover:bg-accent"
        >
          Library
        </Link>
        {collection && (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-faint-ink rtl:rotate-180" />
            <span className="truncate font-medium text-foreground">
              {collection.name}
            </span>
          </>
        )}
      </nav>

      {/* Centre: the single command bar (⌘K). On mobile it collapses to an icon. */}
      <div className="ml-auto flex flex-1 justify-end md:ml-0 md:justify-center md:px-4">
        <CommandBarTrigger className="hidden md:flex" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Find or create anything"
          className="md:hidden"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("olab:open-cmdk"))
          }
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGetStarted}
          data-onboarding="get-started"
          className="hidden items-center gap-2 text-muted-foreground sm:flex"
        >
          <Compass className="h-4 w-4" />
          <span className="hidden lg:inline">{t("onboarding.getStarted")}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={avatarUrl} alt="User" />
              <AvatarFallback className="bg-signal text-sm text-white">
                {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/protected/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="signal"
          onClick={() => router.push("/pricing")}
          className="flex items-center gap-2"
        >
          <Crown className="h-4 w-4" />
          <span className="hidden sm:inline">Upgrade</span>
        </Button>
      </div>
    </header>
  );
}

export default TopBar;
