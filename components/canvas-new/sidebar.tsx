"use client";

import { useState } from "react";
import { Search, Star, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sidebarItems = [
    { title: "Shape In Use", hasActions: false },
    { title: "Standard", hasActions: true },
    { title: "Flowchart", hasActions: true },
    { title: "Containers", hasActions: true },
    { title: "My Saved...", hasActions: true },
  ];

  return (
    <div className={`w-64 border-r border-gray-200 bg-white ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-medium text-[#344054]">Shapes</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-transparent"
          >
            <Search className="h-4 w-4 text-[#344054]" />
          </Button>
        </div>
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <Collapsible
              key={item.title}
              open={openItems[item.title]}
              onOpenChange={() => toggleItem(item.title)}
            >
              <div className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-100/80 rounded-md cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-[#344054] text-sm font-normal">:</span>
                  <span className="text-sm text-[#344054]">{item.title}</span>
                </div>
                <div className="flex items-center">
                  {item.hasActions && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-transparent"
                      >
                        <Star className="h-3.5 w-3.5 text-[#344054]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-transparent"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#344054]" />
                      </Button>
                    </>
                  )}
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-transparent"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-[#344054] transition-transform duration-200 ${
                          openItems[item.title] ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent>
                <div className="py-1 pl-8">
                  <div className="text-sm text-[#344054]/70">No items</div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}
