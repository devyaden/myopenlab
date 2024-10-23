// components/Sidebar.tsx
"use client";

import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@radix-ui/react-collapsible";
import { ChevronDown, Star, Folder } from "lucide-react";

const sidebarData = [
  {
    label: "المترجمة",
    icon: <Star className="ml-4 h-4 w-4 " />,
    subItems: ["قائمة فرعية 1", "قائمة فرعية 2"],
  },
  {
    label: "المجموعة الثانية",
    icon: <Folder className="ml-4 h-4 w-4 " />,
    subItems: ["قائمة فرعية 3", "قائمة فرعية 4", "قائمة فرعية 5"],
  },
];

export const SidebarDashboard = () => {
  return (
    <Sidebar side="right">
      <SidebarHeader className="pt-4 md:pt-24">
        {sidebarData.map((group, index) => (
          <Collapsible key={index} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full">
                  <div className="w-full text-lg flex items-center text-black">
                    {group.icon}
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 text-black" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {group.subItems.map((subItem, subIndex) => (
                      <SidebarMenuSubItem key={subIndex}>
                        <SidebarMenuSubButton>{subItem}</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarHeader>
    </Sidebar>
  );
};
