"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: "For You",
    icon: "/assets/dashboard/nav_1.svg",
    href: "/for-you",
  },
  {
    label: "Agile",
    icon: "/assets/dashboard/nav_2.svg",
    href: "/agile",
  },
  {
    label: "Processes",
    icon: "/assets/dashboard/nav_3.svg",
    href: "/processes",
  },
  {
    label: "Brainstorming",
    icon: "/assets/dashboard/nav_4.svg",
    href: "/brainstorming",
  },
  {
    label: "Systems",
    icon: "/assets/dashboard/nav_5.svg",
    href: "/systems",
  },
  {
    label: "Planning",
    icon: "/assets/dashboard/nav_6.svg",
    href: "/planning",
  },
  {
    label: "Research",
    icon: "/assets/dashboard/nav_7.svg",
    href: "/research",
  },
];

export function DashboardNavMenu() {
  const [selectedItem, setSelectedItem] = useState<NavItem>(navItems[0]);

  return (
    <nav className="w-full  py-8  bg-gradient-to-b from-yadn-gradient-green-from to-yadn-gradient-green-to ">
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-4 px-4 sm:max-w-md sm:grid-cols-3 md:max-w-2xl md:grid-cols-4 lg:max-w-7xl lg:grid-cols-7">
        {navItems.map((item) => {
          const isActive = selectedItem?.href === item.href;
          return (
            <a
              onClick={() => setSelectedItem(item)}
              key={item.href}
              className={cn(
                "group flex flex-col items-center py-2 cursor-pointer",
                isActive && "relative"
              )}
            >
              {isActive && (
                <div className="absolute -top-2 -left-2 -right-2 -bottom-2 rounded-xl bg-white/10" />
              )}
              <div className="relative mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white">
                <Image
                  src={item.icon}
                  alt={item.label}
                  height={10}
                  width={10}
                  className="h-6 w-6 "
                />
              </div>
              <span className="text-center text-sm font-medium text-white">
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
