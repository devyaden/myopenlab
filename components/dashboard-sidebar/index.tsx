"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  href: string;
  icon: string;
  hasDropdown?: boolean;
  dropdownItems?: { title: string; href: string }[];
}

const mainNavItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8.85714 1.14286H3.14286C2.51167 1.14286 2 1.65453 2 2.28571V13.7143C2 14.3455 2.51167 14.8571 3.14286 14.8571H12.8571C13.4883 14.8571 14 14.3455 14 13.7143V6.28571M8.85714 1.14286L14 6.28571M8.85714 1.14286V5.71429C8.85714 6.03571 9.12143 6.28571 9.42857 6.28571H14" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    title: "Recent",
    href: "/recent",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 4.57143V8L10.2857 9.14286M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    title: "Starred",
    href: "/starred",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.43006 2.76663C7.67006 2.0233 8.33006 2.0233 8.57006 2.76663L9.64006 5.99996H13.0701C13.8534 5.99996 14.1501 6.61663 13.5101 7.08329L10.7501 9.13329L11.8201 12.3666C12.0601 13.1099 11.5234 13.7266 10.8834 13.2599L8.00006 11.0999L5.12006 13.2599C4.48006 13.7266 3.94339 13.1099 4.18339 12.3666L5.25339 9.13329L2.49339 7.08329C1.85339 6.61663 2.15006 5.99996 2.93339 5.99996H6.36339L7.43339 2.76663H7.43006Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    title: "Document",
    href: "/document",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8.85714 1.14286H3.14286C2.51167 1.14286 2 1.65453 2 2.28571V13.7143C2 14.3455 2.51167 14.8571 3.14286 14.8571H12.8571C13.4883 14.8571 14 14.3455 14 13.7143V6.28571M8.85714 1.14286L14 6.28571M8.85714 1.14286V5.71429C8.85714 6.03571 9.12143 6.28571 9.42857 6.28571H14" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    hasDropdown: true,
    dropdownItems: [
      { title: "Personal", href: "/document/personal" },
      { title: "Work", href: "/document/work" },
      { title: "Projects", href: "/document/projects" },
    ],
  },
  {
    title: "Share with me",
    href: "/shared",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8C2 6.34315 3.34315 5 5 5C6.65685 5 8 6.34315 8 8C8 9.65685 6.65685 11 5 11C3.34315 11 2 9.65685 2 8Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 3C8 1.34315 9.34315 0 11 0C12.6569 0 14 1.34315 14 3C14 4.65685 12.6569 6 11 6C9.34315 6 8 4.65685 8 3Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 13C8 11.3431 9.34315 10 11 10C12.6569 10 14 11.3431 14 13C14 14.6569 12.6569 16 11 16C9.34315 16 8 14.6569 8 13Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    hasDropdown: true,
    dropdownItems: [
      { title: "Team Files", href: "/shared/team" },
      { title: "Client Files", href: "/shared/client" },
      { title: "Archive", href: "/shared/archive" },
    ],
  },
];

const discoverNavItems: NavItem[] = [
  {
    title: "Templates",
    href: "/templates",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.85714 1.14286H2.28571C1.65453 1.14286 1.14286 1.65453 1.14286 2.28571V6.85714C1.14286 7.48833 1.65453 8 2.28571 8H6.85714C7.48833 8 8 7.48833 8 6.85714V2.28571C8 1.65453 7.48833 1.14286 6.85714 1.14286Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.85714 8H2.28571C1.65453 8 1.14286 8.51167 1.14286 9.14286V13.7143C1.14286 14.3455 1.65453 14.8571 2.28571 14.8571H6.85714C7.48833 14.8571 8 14.3455 8 13.7143V9.14286C8 8.51167 7.48833 8 6.85714 8Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.7143 1.14286H9.14286C8.51167 1.14286 8 1.65453 8 2.28571V6.85714C8 7.48833 8.51167 8 9.14286 8H13.7143C14.3455 8 14.8571 7.48833 14.8571 6.85714V2.28571C14.8571 1.65453 14.3455 1.14286 13.7143 1.14286Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.7143 8H9.14286C8.51167 8 8 8.51167 8 9.14286V13.7143C8 14.3455 8.51167 14.8571 9.14286 14.8571H13.7143C14.3455 14.8571 14.8571 14.3455 14.8571 13.7143V9.14286C14.8571 8.51167 14.3455 8 13.7143 8Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.85714 1.14286H2.28571C1.65453 1.14286 1.14286 1.65453 1.14286 2.28571V6.85714C1.14286 7.48833 1.65453 8 2.28571 8H6.85714C7.48833 8 8 7.48833 8 6.85714V2.28571C8 1.65453 7.48833 1.14286 6.85714 1.14286Z" stroke="currentColor" stroke-width="1.14286" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
];

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!item.hasDropdown) {
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center w-full px-3 py-2 text-[15px] text-[#767676] rounded-lg group hover:bg-[#f1f3f4] hover:text-[#344054]",
          pathname === item.href && "bg-[#f1f3f4] text-[#344054]"
        )}
      >
        <span
          className="mr-3"
          dangerouslySetInnerHTML={{ __html: item.icon }}
        />
        {item.title}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex items-center w-full px-3 py-2 text-[15px] text-[#767676] rounded-lg group hover:bg-[#f1f3f4] hover:text-[#344054]",
            (pathname === item.href || isOpen) && "bg-[#f1f3f4] text-[#344054]"
          )}
        >
          <span
            className="mr-3"
            dangerouslySetInnerHTML={{ __html: item.icon }}
          />
          {item.title}
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 opacity-60 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-9 pr-3">
        {item.dropdownItems?.map((dropdownItem) => (
          <Link
            key={dropdownItem.href}
            href={dropdownItem.href}
            className={cn(
              "flex items-center w-full px-3 py-2 text-[15px] text-[#767676] rounded-lg group hover:bg-[#f1f3f4] hover:text-[#344054]",
              pathname === dropdownItem.href && "bg-[#f1f3f4] text-[#344054]"
            )}
          >
            {dropdownItem.title}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SidebarDashboard() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-gray-200 bg-red-400">
      <SidebarHeader className="p-4 md:pt-20 bg-white">
        <Button className="w-full bg-[#ed1e78] hover:bg-[#ed1e78]/90 text-white rounded-xl py-3 px-4 text-base font-normal">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="mr-2"
          >
            <path
              d="M8 1.14286V14.8571M1.14286 8H14.8571"
              stroke="currentColor"
              strokeWidth="1.71429"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New
        </Button>
      </SidebarHeader>
      <SidebarContent className="px-1 bg-white">
        <nav className="space-y-0.5">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-8 mb-2">
          <h2 className="px-3 text-base font-medium text-[#344054]">
            Discover
          </h2>
          <nav className="mt-2 space-y-0.5">
            {discoverNavItems.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
