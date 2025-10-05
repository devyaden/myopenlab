"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/contexts/userContext";
import { TUTORIALS, useOnboardingStore } from "@/lib/store/useOnboarding";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { STORAGE_URL } from "@/utils/constants";
import {
  CheckCircle,
  ChevronRight,
  Crown,
  GraduationCap,
  Home,
  LogOut,
  Navigation,
  Play,
  RefreshCcw,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const HeaderSidebar = () => {
  const { signOut, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { folders } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);

  // Navigation dialog state
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingTutorial, setPendingTutorial] = useState<{
    id: string;
    name: string;
    targetRoute: string;
    targetName: string;
  } | null>(null);

  const {
    startTutorial,
    resetTutorial,
    resetAllTutorials,
    completedTutorials,
    skippedTutorials,
    syncWithDatabase,
    getContextualTutorials,
    getTutorialStatus,
    isRunning,
    activeTutorial,
  } = useOnboardingStore();

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

  // Sync with database when user changes
  useEffect(() => {
    if (user?.id) {
      syncWithDatabase(user.id);
    }
  }, [user?.id, syncWithDatabase]);

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

  const handleSignOut = async () => {
    signOut();
  };

  const handleStartTutorial = (tutorialId: string) => {
    const tutorial = TUTORIALS[tutorialId];
    if (!tutorial) return;

    // Check if tutorial requires navigation
    const currentPath = pathname;
    const isOnCorrectPage = tutorial.context.routes.some(
      (route) => currentPath === route || currentPath.startsWith(route)
    );

    if (!isOnCorrectPage) {
      // Show navigation dialog
      const targetRoute = tutorial.context.routes[0];
      if (targetRoute) {
        setPendingTutorial({
          id: tutorialId,
          name: tutorial.name,
          targetRoute,
          targetName: getPageName(targetRoute),
        });
        setShowNavigationDialog(true);
        return;
      }
    }

    // Start tutorial directly if on correct page
    startTutorial(tutorialId);
  };

  const handleRestartTutorial = (tutorialId: string) => {
    resetTutorial(tutorialId);
    // Small delay to ensure state is updated before starting
    setTimeout(() => {
      handleStartTutorial(tutorialId);
    }, 100);
  };

  const handleResetAllTutorials = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all tutorials? This will mark all tutorials as incomplete and allow you to take them again."
      )
    ) {
      resetAllTutorials();
    }
  };

  const getPageName = (route: string): string => {
    switch (route) {
      case "/protected":
        return "Home page";
      case "/protected/folder/":
        return "Folder page";
      default:
        return "appropriate page";
    }
  };

  const getTutorialStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "skipped":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "available":
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Navigation className="h-4 w-4 text-orange-500" />;
    }
  };

  const getTutorialStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "skipped":
        return "Skipped";
      case "available":
        return "Available";
      default:
        return "Navigate to start";
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationDialog(false);
    setPendingTutorial(null);
  };

  const handleConfirmNavigation = () => {
    if (pendingTutorial) {
      // Store tutorial to start after navigation
      sessionStorage.setItem("pendingTutorial", pendingTutorial.id);
      router.push(pendingTutorial.targetRoute);
    }
    setShowNavigationDialog(false);
    setPendingTutorial(null);
  };

  // Get tutorial availability based on current page
  const getAvailableTutorials = () => {
    return getContextualTutorials(pathname);
  };

  const availableTutorials = getAvailableTutorials();
  const totalCount = Object.keys(TUTORIALS).length;
  const completedCount = completedTutorials.length;

  return (
    <>
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
          <nav className="hidden md:flex items-center onboarding-breadcrumb">
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
          {/* Tutorial Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Tutorials</span>
                {completedCount > 0 && (
                  <span className="bg-yadn-accent-green text-white text-xs px-2 py-0.5 rounded-full">
                    {completedCount}/{totalCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>
                <div className="flex items-center justify-between">
                  <span>Interactive Tutorials</span>
                  <span className="text-xs text-muted-foreground">
                    {completedCount}/{totalCount} completed
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Progress bar */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="text-xs font-medium">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yadn-accent-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Available tutorials for current page */}
              {availableTutorials.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Available on this page
                  </DropdownMenuLabel>
                  {availableTutorials.map((tutorial) => {
                    const status = getTutorialStatus(tutorial.id, pathname);
                    const canStart =
                      (status === "available" ||
                        status === "completed" ||
                        status === "skipped") &&
                      !isRunning;
                    const isCurrentlyRunning = activeTutorial === tutorial.id;

                    return (
                      <DropdownMenuItem
                        key={tutorial.id}
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() =>
                          canStart
                            ? status === "completed" || status === "skipped"
                              ? handleRestartTutorial(tutorial.id)
                              : handleStartTutorial(tutorial.id)
                            : undefined
                        }
                        disabled={!canStart && !isCurrentlyRunning}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{tutorial.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {tutorial.name}
                              </span>
                              {getTutorialStatusIcon(status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {tutorial.value}
                            </p>
                            <p className="text-xs text-blue-600">
                              {isCurrentlyRunning
                                ? "Currently running"
                                : status === "completed" || status === "skipped"
                                  ? `${getTutorialStatusLabel(status)} - Click to restart`
                                  : getTutorialStatusLabel(status)}
                            </p>
                          </div>
                        </div>
                        {canStart && (
                          <div className="ml-2">
                            {status === "completed" || status === "skipped" ? (
                              <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Play className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* All tutorials */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                All Tutorials
              </DropdownMenuLabel>
              {Object.values(TUTORIALS).map((tutorial) => {
                const status = getTutorialStatus(tutorial.id, pathname);
                const canStart = !isRunning && activeTutorial !== tutorial.id;
                const isCurrentlyRunning = activeTutorial === tutorial.id;
                const needsNavigation = status === "unavailable";

                return (
                  <DropdownMenuItem
                    key={tutorial.id}
                    className="flex items-center justify-between p-3"
                    asChild
                  >
                    <div>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-lg">{tutorial.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tutorial.name}</span>
                            {getTutorialStatusIcon(status)}
                            {needsNavigation && (
                              <Navigation className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {tutorial.value}
                          </p>
                          <p className="text-xs text-blue-600">
                            {isCurrentlyRunning
                              ? "Currently running"
                              : status === "completed" || status === "skipped"
                                ? `${getTutorialStatusLabel(status)} - Click to restart`
                                : needsNavigation
                                  ? "Will navigate to correct page"
                                  : getTutorialStatusLabel(status)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {canStart && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (
                                status === "completed" ||
                                status === "skipped"
                              ) {
                                handleRestartTutorial(tutorial.id);
                              } else {
                                handleStartTutorial(tutorial.id);
                              }
                            }}
                          >
                            {status === "completed" || status === "skipped" ? (
                              <RefreshCcw className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />

              {/* Tutorial management */}
              {(completedCount > 0 || skippedTutorials.length > 0) && (
                <DropdownMenuItem
                  onClick={handleResetAllTutorials}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All Tutorials
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
                  <Link
                    href={"/protected/profile"}
                    className="flex items-center"
                  >
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

      {/* Navigation Confirmation Dialog */}
      <Dialog
        open={showNavigationDialog}
        onOpenChange={setShowNavigationDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-yadn-accent-green" />
              Navigate to Start Tutorial
            </DialogTitle>
            <DialogDescription>
              {pendingTutorial && (
                <>
                  The <strong>{pendingTutorial.name}</strong> tutorial works
                  best on the <strong>{pendingTutorial.targetName}</strong>.
                  <br />
                  <br />
                  Would you like to navigate there and start the tutorial?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNavigation}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmNavigation}
              className="bg-yadn-accent-green hover:bg-yadn-accent-green/90"
            >
              Navigate & Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
