"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ChevronLeft, Users, Mail, Clock, Home, BarChart2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();

  // Main menu items
  const mainMenuItems = [
    {
      title: "Members",
      icon: Users,
      path: "/admin/members",
    },
    // {
    //   title: "Invite",
    //   icon: Mail,
    //   path: "/admin/invite",
    // },
    // {
    //   title: "Audit",
    //   icon: Clock,
    //   path: "/admin/audit",
    // },
  ];

  // Global settings items
  const globalSettingsItems = [
    {
      title: "Homepage",
      icon: Home,
      path: "/admin/homepage",
      highlight: true,
    },
    {
      title: "Analytics",
      icon: BarChart2,
      path: "/admin/analytics",
    },
  ];

  // Footer item
  const footerItem = {
    title: "Invite",
    icon: Mail,
    path: "/admin/invite-users",
  };

  // Helper function to determine if a menu item is active
  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar className="border-r border-gray-200 bg-white w-64">
      <SidebarHeader className="p-4 bg-white pt-24">
        <Link
          href="/user-panel"
          className="flex items-center text-sm font-medium border py-2 rounded-md px-3  hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back To User Panel
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 bg-white">
        {/* Main menu section */}
        <div className="space-y-1">
          {mainMenuItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className={`flex items-center px-3 py-2 rounded-md ${
                isActive(item.path)
                  ? "text-gray-700 font-medium"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <item.icon
                className={`h-5 w-5 mr-3 ${
                  isActive(item.path) ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <span
                className={`text-sm ${isActive(item.path) ? "font-medium" : ""}`}
              >
                {item.title}
              </span>
            </Link>
          ))}
        </div>

        {/* <div className="mt-6">
          <h3 className="px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            GLOBAL SETTINGS
          </h3>

          <div className="mt-2 space-y-1">
            {globalSettingsItems.map((item, index) => (
              <Link
                key={index}
                href={item.path}
                className={`flex items-center px-3 py-2 rounded-md ${
                  item.highlight
                    ? "text-pink-500"
                    : isActive(item.path)
                      ? "text-gray-700"
                      : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mr-3 ${
                    item.highlight
                      ? "text-pink-500"
                      : isActive(item.path)
                        ? "text-gray-500"
                        : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    item.highlight || isActive(item.path) ? "font-medium" : ""
                  }`}
                >
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div> */}

        {/* Footer section */}
        <div className="absolute bottom-4 left-0 w-full px-3">
          <Link
            href={footerItem.path}
            className="flex items-center px-3 py-2 text-gray-500 rounded-md hover:bg-gray-100"
          >
            <footerItem.icon className="h-5 w-5 mr-3 text-gray-400" />
            <span className="text-sm">{footerItem.title}</span>
          </Link>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
