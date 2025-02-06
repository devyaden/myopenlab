"use client";

import { useState } from "react";
import {
  Search,
  Star,
  Trash2,
  ChevronDown,
  Square,
  Circle,
  Diamond,
  Triangle,
  User,
  Box,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  className?: string;
  onDragStart: (event: React.DragEvent, shapeType: string) => void;
}

export function Sidebar({ className, onDragStart }: SidebarProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sidebarItems = [
    {
      title: "Basic Shapes",
      shapes: [
        { name: "Rectangle", type: "rectangle", icon: Square },
        { name: "Rounded Rectangle", type: "rounded", icon: Square },
        { name: "Circle", type: "circle", icon: Circle },
        { name: "Diamond", type: "diamond", icon: Diamond },
        { name: "Triangle", type: "triangle", icon: Triangle },
      ],
    },
    {
      title: "UML Shapes",
      shapes: [
        { name: "Class", type: "class", icon: Box },
        { name: "Interface", type: "interface", icon: Box },
        { name: "Use Case", type: "useCase", icon: Circle },
        { name: "Actor", type: "actor", icon: User },
      ],
    },
    {
      title: "Flowchart",
      shapes: [
        { name: "Process", type: "rectangle", icon: Square },
        { name: "Decision", type: "diamond", icon: Diamond },
        { name: "Input/Output", type: "parallelogram", icon: Square },
        { name: "Terminator", type: "terminator", icon: Square },
      ],
    },
    {
      title: "Containers",
      shapes: [{ name: "Swimlane", type: "swimlane", icon: Square }],
    },
    {
      title: "Text",
      shapes: [{ name: "Text Node", type: "text", icon: Type }],
    },
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
                  {item.shapes.map((shape) => (
                    <div
                      key={shape.name}
                      className="flex items-center gap-2 py-1 cursor-move hover:bg-gray-100 rounded px-2"
                      draggable
                      onDragStart={(e) => onDragStart(e, shape.type)}
                    >
                      <shape.icon className="h-4 w-4" />
                      <span className="text-sm text-[#344054]">
                        {shape.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}
