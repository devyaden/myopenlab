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
import { useUser } from "@/lib/contexts/userContext";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CommandBarTrigger } from "@/components/command-palette/CommandBarTrigger";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { STORAGE_URL } from "@/utils/constants";
import {
  ChevronRight,
  Compass,
  Crown,
  Home,
  LogOut,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const HeaderSidebar = () => {
  const { signOut, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { folders } = useSidebarStore();

  const { reopenChecklist, startSpotlight } = useOnboardingStore();
  const t = useT();

  const avatarUrl = STORAGE_URL + `avatars/` + user?.avatar_url;

  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = () => {
    if (pathname === "/protected") {
      return [{ label: "", href: "/protected" }];
    }

    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "", href: "/protected" }];

    // Check if we're in a folder route
    if (paths.includes("folder")) {
      const folderId = paths[paths.indexOf("folder") + 1];

      // Special case for root folder
      if (folderId === "root") {
        breadcrumbs.push({ label: "Root", href: `/protected/folder/root` });
      } else {
        const folder = folders.find((f) => f.id === folderId);
        if (folder) {
          breadcrumbs.push({
            label: folder.name,
            href: `/protected/folder/${folderId}`,
          });
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleSignOut = async () => {
    signOut();
  };

  // Non-blocking re-entry: reopen the checklist and replay the spotlight.
  // The spotlight's first anchor lives on the dashboard, so route there first.
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
    <header className="flex items-center justify-between gap-4 bg-yadn-dark-background px-6 z-50 py-4 min-w-full h-16">
      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2 justify-center !h-full">
          <Image
            src="/assets/global/app-logo-white.svg"
            alt="Logo"
            width={32}
            height={16}
            className="h-5 w-full"
          />
        </Link>

        {/* Breadcrumbs navigation */}
        <nav className="hidden md:flex items-center">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-white/50" />
              )}
              <Link
                href={crumb.href}
                className={`flex justify-center items-center text-sm ${
                  index === breadcrumbs.length - 1
                    ? "text-white font-medium"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {index === 0 && <Home className="h-4 w-4 inline-block" />}
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Global command bar — the visible ⌘K front door (find or create anything) */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <CommandBarTrigger />
      </div>

      <div className="flex items-center gap-4">
        {/* Light/dark theme toggle */}
        <ThemeToggle className="text-white hover:bg-white/10" />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Onboarding re-entry */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGetStarted}
          data-onboarding="get-started"
          className="text-white hover:bg-white/10 flex items-center gap-2"
        >
          <Compass className="h-4 w-4" />
          <span className="hidden sm:inline">{t("onboarding.getStarted")}</span>
        </Button>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={avatarUrl} alt="User" />
                <AvatarFallback className="bg-yadn-accent-green text-white text-2xl">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="mb-2 cursor-pointer">
                <Link href={"/protected/profile"} className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSignOut()}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={() => router.push("/pricing")}
            className="flex items-center gap-2 bg-yadn-accent-green text-white text-sm font-medium hover:bg-yadn-accent-green/90 shadow-md"
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
