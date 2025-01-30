"use client";

import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  ClipboardList,
  Lightbulb,
  Network,
  Search,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: "For You",
    icon: Star,
    href: "/for-you",
  },
  {
    label: "Agile",
    icon: Users,
    href: "/agile",
  },
  {
    label: "Processes",
    icon: BrainCircuit,
    href: "/processes",
  },
  {
    label: "Brainstorming",
    icon: Lightbulb,
    href: "/brainstorming",
  },
  {
    label: "Systems",
    icon: Network,
    href: "/systems",
  },
  {
    label: "Planning",
    icon: ClipboardList,
    href: "/planning",
  },
  {
    label: "Research",
    icon: Search,
    href: "/research",
  },
];

export function DashboardNavMenu() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-[#E328AF] py-8">
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-4 px-4 sm:max-w-md sm:grid-cols-3 md:max-w-2xl md:grid-cols-4 lg:max-w-7xl lg:grid-cols-7">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col items-center",
                isActive && "relative"
              )}
            >
              {isActive && (
                <div className="absolute -top-2 -left-2 -right-2 -bottom-2 rounded-xl bg-white/10" />
              )}
              <div className="relative mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <item.icon className="h-6 w-6 text-[#d7bed0]" />
              </div>
              <span className="text-center text-sm font-medium text-white">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
