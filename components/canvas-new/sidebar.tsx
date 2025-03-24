"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Circle,
  Diamond,
  GripVertical,
  Image,
  MapPin,
  RockingChair,
  Search,
  Square,
  Star,
  StretchHorizontal,
  Triangle,
  Type,
  User,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  onDragStart: (event: React.DragEvent, shapeType: string) => void;
  isVisible?: boolean;
}

interface Shape {
  name: string;
  type: string;
  icon: any;
}

interface SidebarItem {
  title: string;
  shapes: Shape[];
}

export function Sidebar({ onDragStart, isVisible }: SidebarProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<SidebarItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([
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
      title: "Actors",
      shapes: [
        { name: "Actor", type: "actor", icon: User },
        { name: "Standing Woman", type: "standing-woman", icon: User },
        { name: "Sitting", type: "sitting", icon: RockingChair },
        {
          name: "Arms Stretched",
          type: "arms-stretched",
          icon: StretchHorizontal,
        },
        {
          name: "Walking Man",
          type: "walking-man",
          icon: MapPin,
        },
      ],
    },
    {
      title: "Flowchart",
      shapes: [
        { name: "Process", type: "rectangle", icon: Square },
        { name: "Decision", type: "diamond", icon: Diamond },
        { name: "Input/Output", type: "parallelo gram", icon: Square },
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
    {
      title: "Images",
      shapes: [{ name: "Image", type: "image", icon: Image }],
    },
  ]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedItemIndex(index);
    // Add data to the drag event to make it work properly
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (index !== draggedItemIndex) {
      setDragOverItemIndex(index);
    }
    // Set the drop effect
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItemIndex === null) return;

    // Create a copy of the items
    const newItems = [...sidebarItems];

    // Remove the dragged item
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);

    // Insert at the new position
    newItems.splice(index, 0, draggedItem);

    // Update the state
    setSidebarItems(newItems);

    // Reset drag indices
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(sidebarItems);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sidebarItems
      .map((category) => {
        // Filter shapes within each category
        const filteredShapes = category.shapes.filter(
          (shape) =>
            shape.name.toLowerCase().includes(query) ||
            shape.type.toLowerCase().includes(query)
        );

        // Return category with filtered shapes
        return {
          ...category,
          shapes: filteredShapes,
        };
      })
      .filter((category) => category.shapes.length > 0); // Only keep categories with matching shapes

    setFilteredItems(filtered);

    // Auto-expand categories that have search results
    const newOpenItems = { ...openItems };
    filtered.forEach((item) => {
      newOpenItems[item.title] = true;
    });
    setOpenItems(newOpenItems);
  }, [searchQuery, sidebarItems]);

  // Initialize filtered items with all items
  useEffect(() => {
    setFilteredItems(sidebarItems);
  }, [sidebarItems]);

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      // Focus the search input when showing
      setTimeout(() => {
        document.getElementById("shape-search")?.focus();
      }, 0);
    } else {
      // Clear search when closing
      setSearchQuery("");
    }
  };

  return (
    <div
      className={cn(
        "border-r border-gray-200 bg-white fixed md:relative transition-all duration-300 ease-in-out z-10 h-screen flex flex-col",
        isVisible ? "w-72 translate-x-0" : "w-0 -translate-x-full"
      )}
    >
      <div className="flex items-center justify-between pb-2 px-4 pt-3 sticky top-0 bg-white z-10">
        {isSearching ? (
          <div className="flex items-center gap-2 w-full">
            <input
              id="shape-search"
              type="text"
              placeholder="Search shapes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-transparent flex-shrink-0"
              onClick={toggleSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-md font-semibold">Shapes</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-transparent"
              onClick={toggleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div
        className="overflow-y-auto flex-1 pb-4"
        style={{
          overflowY: "auto",
          maxHeight: "calc(100vh - 60px)",
        }}
      >
        <div className="space-y-1">
          {filteredItems.map((item, index) => (
            <Collapsible
              key={item.title + index}
              open={openItems[item.title]}
              onOpenChange={() => toggleItem(item.title)}
            >
              <CollapsibleTrigger asChild>
                <div
                  className={`flex items-center justify-between px-2 hover:bg-gray-100/80 rounded-md cursor-pointer py-4 border-t ${
                    draggedItemIndex === index ? "opacity-50" : ""
                  } ${dragOverItemIndex === index ? "border-t-2 border-blue-500" : ""}`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-normal cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <GripVertical className="h-5 w-5 text-[#98A2B3]" />
                    </span>
                    <span className="text-md font-semibold">{item.title}</span>
                    <span className="text-xs text-gray-500">
                      ({item.shapes.length})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-transparent"
                    >
                      <Star className="h-4 w-4" />
                    </Button>

                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openItems[item.title] ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="py-1 px-4 grid grid-cols-3">
                  {item.shapes.map((shape) => (
                    <div
                      key={shape.name}
                      className="flex items-center justify-center py-1 cursor-move hover:bg-gray-100 rounded px-2 flex-col"
                      draggable
                      onDragStart={(e) => onDragStart(e, shape.type)}
                    >
                      <shape.icon className="h-6 w-6" />
                      <span className="text-sm text-center line-clamp-1">
                        {shape.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Search className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No shapes found</p>
              <p className="text-xs text-gray-400">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
