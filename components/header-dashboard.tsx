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
import { STORAGE_URL } from "@/utils/constants";
import {
  Bell,
  Crown,
  HelpCircle,
  LogOut,
  Menu,
  User,
  ChevronRight,
  Home,
  PanelRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/lib/store/useOnboarding";

interface HeaderSidebarProps {
  onToggleSidebar?: () => void;
}

export const HeaderSidebar = ({ onToggleSidebar }: HeaderSidebarProps) => {
  const { signOut, user } = useUser();
  const { setOpenMobile } = useSidebar();
  const { isFirstVisit, setNotFirstVisit } = useOnboardingStore();
  
  const pathname = usePathname();
  const { folders } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);

  const avatarUrl = STORAGE_URL + `avatars/` + user?.avatar_url;

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

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
        breadcrumbs.push({
          label: "Root",
          href: `/protected/folder/root`,
        });
      } else {
        // Regular folder lookup
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

  const handleSignOut = () => {
    if (isFirstVisit) {
      setNotFirstVisit();
    }
    signOut()
  }

  return (
    <header className="flex items-center justify-between gap-4 bg-yadn-dark-background px-6 z-50 py-4 min-w-full h-16">
      <div className="flex items-center gap-5 flex-1">
        <Link
          href="/"
          className="flex items-center gap-2 justify-center !h-full"
        >
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

      <div className="flex items-center gap-4">
        {/* Mobile menu toggle - only shown on mobile */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white/70 hover:bg-transparent hover:text-white"
            onClick={() => onToggleSidebar && onToggleSidebar()}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        )}

        {/* Desktop sidebar toggle - only shown on desktop */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-white/70 hover:bg-transparent hover:text-white"
            onClick={() => onToggleSidebar && onToggleSidebar()}
          >
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}

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
              <DropdownMenuItem>
                <Link href={"/protected/profile"} className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSignOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            className="hidden items-center gap-2 bg-yadn-accent-dark-blue text-sm font-medium hover:bg-yadn-accent-dark-blue/90 sm:flex"
          >
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
};
