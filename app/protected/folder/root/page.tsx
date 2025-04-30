"use client";

import { HeaderSidebar } from "@/components/header-dashboard";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FolderContent } from "@/components/dashboard/folder-content";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootFolderPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Handle screen resize and detect mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      // Hide sidebar by default on small screens
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    // Check on initial load
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleToggleSidebar = (show: boolean) => {
    if (show === showSidebar || isAnimating) return;

    setIsAnimating(true);

    if (!show) {
      // Closing sidebar
      if (sidebarRef.current && mainRef.current) {
        // Start both animations simultaneously
        requestAnimationFrame(() => {
          if (sidebarRef.current)
            sidebarRef.current.style.transform = "translateX(100%)";
          if (mainRef.current) mainRef.current.style.width = "100%";
        });

        // Wait for animation to complete
        setTimeout(() => {
          setShowSidebar(false);
          setIsAnimating(false);
        }, 300);
      }
    } else {
      // Opening sidebar
      setShowSidebar(true);

      // Allow DOM to update before animating
      requestAnimationFrame(() => {
        if (sidebarRef.current)
          sidebarRef.current.style.transform = "translateX(100%)";

        // Start animation in the next frame for smooth transition
        requestAnimationFrame(() => {
          if (sidebarRef.current)
            sidebarRef.current.style.transform = "translateX(0)";
          if (mainRef.current)
            mainRef.current.style.width = "calc(100% - 20rem)";

          setTimeout(() => {
            setIsAnimating(false);
          }, 300);
        });
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen">
        <HeaderSidebar
          onToggleSidebar={() => handleToggleSidebar(!showSidebar)}
        />

        <div className="flex flex-1 overflow-hidden">
          <main
            ref={mainRef}
            className="h-full overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              width:
                showSidebar && !isAnimating ? "calc(100% - 20rem)" : "100%",
            }}
          >
            <FolderContent folderId="root" />
          </main>

          {!isMobile && !showSidebar && !isAnimating && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-l-md rounded-r-none z-10"
              onClick={() => handleToggleSidebar(true)}
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          )}

          {(showSidebar || isAnimating) && !isMobile && (
            <aside
              ref={sidebarRef}
              className="w-80 border-l border-gray-100 bg-white overflow-hidden transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  showSidebar && !isAnimating
                    ? "translateX(0)"
                    : "translateX(100%)",
              }}
            >
              {/* <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-4"
                  onClick={() => handleToggleSidebar(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div> */}
              <RecentDocuments handleToggleSidebar={handleToggleSidebar} />
            </aside>
          )}

          {isMobile && showSidebar && (
            <>
              <div
                className="fixed inset-0 bg-black/20 z-20 animate-in fade-in duration-200"
                onClick={() => handleToggleSidebar(false)}
              />
              <aside className="fixed right-0 top-16 bottom-0 w-80 border-l border-gray-100 bg-white overflow-hidden z-30 shadow-lg animate-in slide-in-from-right duration-300">
                <RecentDocuments />
              </aside>
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
