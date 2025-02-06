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
  GripVertical,
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
      <div className="pt-3 ">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 px-4 ">
          <h2 className=" text-lg font-semibold ">Shapes</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-transparent"
          >
            <Search className="h-4 w-4 " />
          </Button>
        </div>
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <Collapsible
              key={item.title}
              open={openItems[item.title]}
              onOpenChange={() => toggleItem(item.title)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-2 hover:bg-gray-100/80 rounded-md cursor-pointer py-4 border-b">
                  <div className="flex items-center gap-2 ">
                    <span className=" text-sm font-normal">
                      <GripVertical className="h-5 w-5 text-[#98A2B3]" />
                    </span>
                    <span className="text-base font-semibold  ">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-transparent"
                    >
                      <Star className="h-4 w-4 " />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 " />
                    </Button>

                    <ChevronDown
                      className={`h-4 w-4  transition-transform duration-200 ${
                        openItems[item.title] ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
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
                      <span className="text-sm ">{shape.name}</span>
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
