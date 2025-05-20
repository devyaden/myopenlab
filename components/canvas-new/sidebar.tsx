"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  GripVertical,
  Search,
  Star,
  StarIcon,
  StarOff,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { renderShapePreview } from "./shape-utils";
import { useOnboardingStore } from "@/lib/store/useOnboarding";
import Joyride from 'react-joyride';
import CustomJoyrideTooltip from "../CustomJoyrideTooltip";

interface SidebarProps {
  onDragStart: (event: React.DragEvent, shapeType: string) => void;
  isVisible?: boolean;
  onShapeClick?: (shapeType: string) => void;
  onOpenImageManager?: () => void;
}

// Shape definitions
interface Shape {
  name: string;
  type: string;
  component: React.ReactNode;
}

interface ShapeCategory {
  title: string;
  shapes: Shape[];
}

export function Sidebar({
  onDragStart,
  isVisible = true,
  onShapeClick,
  onOpenImageManager,
}: SidebarProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "Basic Shapes": false,
    "Arrows & Lines": false,
    Actors: false,
    Resources: false,
    Extras: false,
  });

  const [starredCategories, setStarredCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Define the shape categories
  const shapeCategories: ShapeCategory[] = [
    {
      title: "Basic Shapes",
      shapes: [
        {
          name: "Rectangle",
          type: "rectangle",
          component: renderShapePreview("rectangle", 32), // Increased size
        },
        {
          name: "Square",
          type: "square",
          component: renderShapePreview("square", 32),
        },
        {
          name: "Rounded Rectangle",
          type: "rounded",
          component: renderShapePreview("rounded", 32),
        },
        {
          name: "Pill shape",
          type: "capsule",
          component: renderShapePreview("capsule", 32),
        },
        {
          name: "Circle",
          type: "circle",
          component: renderShapePreview("circle", 32),
        },
        {
          name: "Diamond",
          type: "diamond",
          component: renderShapePreview("diamond", 32),
        },
        {
          name: "Triangle",
          type: "triangle",
          component: renderShapePreview("triangle", 32),
        },
        {
          name: "Hexagon",
          type: "hexagon",
          component: renderShapePreview("hexagon", 32),
        },
      ],
    },
    {
      title: "Arrows & Lines",
      shapes: [
        {
          name: "Left Arrow",
          type: "left-arrow",
          component: renderShapePreview("left-arrow", 32),
        },
        {
          name: "Right Arrow",
          type: "right-arrow",
          component: renderShapePreview("right-arrow", 32),
        },
        {
          name: "Top Arrow",
          type: "top-arrow",
          component: renderShapePreview("top-arrow", 32),
        },
        {
          name: "Bottom Arrow",
          type: "bottom-arrow",
          component: renderShapePreview("bottom-arrow", 32),
        },
        // {
        //   name: "Solid Line",
        //   type: "solid-line",
        //   component: renderLinePreview("solid-line", 32),
        // },
        // {
        //   name: "Dashed Line",
        //   type: "dashed-line",
        //   component: renderLinePreview("dashed-line", 32),
        // },
        // {
        //   name: "Dotted line",
        //   type: "dotted-line",
        //   component: renderLinePreview("dotted-line", 32),
        // },
      ],
    },
    {
      title: "Actors",
      shapes: [
        {
          name: "Standing man",
          type: "actor",
          component: renderShapePreview("actor", 32),
        },
        {
          name: "Standing woman",
          type: "standing-woman",
          component: renderShapePreview("standing-woman", 32),
        },
        {
          name: "Sitting",
          type: "sitting",
          component: renderShapePreview("sitting", 32),
        },
        {
          name: "Arms stretched",
          type: "arms-stretched",
          component: renderShapePreview("arms-stretched", 32),
        },
        {
          name: "Walking man",
          type: "walking-man",
          component: renderShapePreview("walking-man", 32),
        },
      ],
    },
    {
      title: "Resources",
      shapes: [
        {
          name: "Document",
          type: "document",
          component: renderShapePreview("document", 32),
        },
        {
          name: "Cylinder",
          type: "cylinder",
          component: renderShapePreview("cylinder", 32),
        },
        {
          name: "Message Bubble",
          type: "message-bubble",
          component: renderShapePreview("message-bubble", 32),
        },
      ],
    },
    {
      title: "Extras",
      shapes: [
        {
          name: "Image",
          type: "image",
          component: (
            <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
              <div className="w-5 h-5 bg-gray-300"></div>
            </div>
          ),
        },
        {
          name: "Swimlane",
          type: "swimlane",
          component: (
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  d="M1 3h22v6H1zm0 8h22v6H1zm0 8h22v6H1z"
                  stroke="black"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          ),
        },
      ],
    },
  ];

  const { isFirstVisit, canvasOnbording, setCanvasOnbording, setIsChecked, isChecked } = useOnboardingStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [filteredCategories, setFilteredCategories] =
    useState<ShapeCategory[]>(shapeCategories);

  // Filter shapes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(shapeCategories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = shapeCategories
      .map((category) => {
        // Filter shapes within each category
        const filteredShapes = category.shapes.filter(
          (shape) =>
            shape.name.toLowerCase().includes(query) ||
            shape?.type.toLowerCase().includes(query)
        );

        // Return category with filtered shapes
        return {
          ...category,
          shapes: filteredShapes,
        };
      })
      .filter((category) => category.shapes.length > 0); // Only keep categories with matching shapes

    setFilteredCategories(filtered);

    // Auto-expand categories that have search results
    const newOpenItems = { ...openItems };
    filtered.forEach((item) => {
      newOpenItems[item.title] = true;
    });
    setOpenItems(newOpenItems);
  }, [searchQuery]);

  const toggleItem = useCallback((title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }, []);

  const toggleSearch = useCallback(() => {
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
  }, [isSearching]);

  const toggleStar = useCallback(
    (categoryTitle: string, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent category from toggling when clicking star
      setStarredCategories((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(categoryTitle)) {
          newSet.delete(categoryTitle);
        } else {
          newSet.add(categoryTitle);
        }
        return newSet;
      });
    },
    []
  );

  // Sort categories to show starred ones first
  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const aStarred = starredCategories.has(a.title);
      const bStarred = starredCategories.has(b.title);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      return 0;
    });
  }, [filteredCategories, starredCategories]);

  // Function to handle dragging a shape - using the original implementation
  const handleShapeDragStart = useCallback(
    (e: React.DragEvent, shapeType: string) => {
      onDragStart(e, shapeType);
    },
    [onDragStart]
  );

  // Function to handle clicking a shape
  const handleShapeClick = useCallback(
    (shapeType: string) => {
      // For image type, open the image manager
      if (shapeType === "image" && onOpenImageManager) {
        onOpenImageManager();
      } else if (onShapeClick) {
        // For other shapes, use the regular onClick handler
        onShapeClick(shapeType);
      }
    },
    [onShapeClick, onOpenImageManager]
  );

  const steps = sortedCategories.map((cat, index) => {
    let content = '';

    switch (cat.title.toLowerCase()) {
      case 'shapes':
        content = 'This is the Shapes category. Click and drag any shape into the canvas to start building.';
        break;
      case 'arrows & lines':
        content = 'Use Arrows & Lines to connect your shapes and define flow or relationships.';
        break;
      case 'actors':
        content = 'The Actors category includes user or system entities. Drag these to represent roles.';
        break;
      case 'resources':
        content = 'Resources represent systems, data sources, or tools in your diagram. Click and drag to use them.';
        break;
      case 'extras':
        content = 'Extras include additional visual elements like icons or labels to enhance your diagram.';
        break;
      default:
        content = `This is the "${cat.title}" category. Click to expand and view shapes.`;
    }

    return {
      target: `.shape-category-title-${index}`,
      content,
      disableBeacon: true,
    };
  });

  const handleJoyrideCllback = (data: any) => {
    const { action, index, status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      setCanvasOnbording(false);
    }
  }

  const handleDontShowAgainChange = (e) => {
    setIsChecked(e?.target?.value)
  }

  useEffect(() => {
    setTimeout(()=> {
      setHasMounted(true);
    }, 100)
  }, [])

  return (
    <aside
      className={cn(
        "border-r border-gray-200 bg-white fixed md:static transition-all duration-300 ease-in-out z-10",
        isVisible ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-0"
      )}
    >
      {isFirstVisit &&
       isVisible && 
       hasMounted && 
       canvasOnbording &&
       <Joyride
          steps={steps}
          callback={handleJoyrideCllback}
          tooltipComponent={(props) => (
          <CustomJoyrideTooltip
            {...props} 
            onDontShowAgainChange={handleDontShowAgainChange}
            isChecked={isChecked}
          />
        )}
          continuous
          showProgress
          showSkipButton
          styles={{
            options: {
              primaryColor: '#22c55e',
              zIndex: 10000,
            },
          }}
        />
      }
      {isVisible && (
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <header className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-gray-200">
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
              <div className="flex items-center justify-between">
                <h2 className="text-md font-semibold">Shapes</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-transparent"
                  onClick={toggleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
          </header>

          {/* Scrollable Content */}
          <div className="overflow-y-auto h-[calc(100vh-57px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
            <div>
              {/* Favorites Section */}
              {sortedCategories.some((cat) =>
                starredCategories.has(cat.title)
              ) && (
                <>
                  <div className="px-4 py-3 text-base text-gray-600 font-semibold">
                    Favorites
                  </div>
                  {sortedCategories
                    .filter((cat) => starredCategories.has(cat.title))
                    .map((category) => (
                      <Collapsible
                        key={category.title}
                        open={openItems[category.title]}
                        onOpenChange={() => toggleItem(category.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between px-4 hover:bg-gray-100/80 cursor-pointer py-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-base text-gray-700">
                                {category.title}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({category.shapes.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 hover:bg-transparent",
                                  starredCategories.has(category.title) &&
                                    "text-yellow-400"
                                )}
                                onClick={(e) => toggleStar(category.title, e)}
                              >
                                {starredCategories.has(category.title) ? (
                                  <Star className="h-4 w-4 fill-current" />
                                ) : (
                                  <StarIcon className="h-4 w-4" />
                                )}
                              </Button>

                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  openItems[category.title] ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="py-2 px-4 grid grid-cols-3 gap-2">
                            {category.shapes.map((shape) => (
                              <div
                                key={shape.name}
                                className="flex flex-col items-center justify-center py-2 cursor-move hover:bg-gray-100 rounded px-2"
                                draggable
                                onDragStart={(e) =>
                                  handleShapeDragStart(e, shape?.type)
                                }
                                onClick={() => handleShapeClick(shape?.type)}
                              >
                                <div className="flex items-center justify-center h-10">
                                  {shape.component}
                                </div>
                                <span className="text-xs text-center line-clamp-1 mt-1">
                                  {shape.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </>
              )}

              {/* Regular Categories Section */}
              {sortedCategories.some(
                (cat) => !starredCategories.has(cat.title)
              ) && (
                <>
                  <div className="px-4 py-3 text-base text-gray-600 border-t border-gray-100 font-semibold">
                    All Categories
                  </div>
                  {sortedCategories
                    .filter((cat) => !starredCategories.has(cat.title))
                    .map((category, index) => (
                      <Collapsible
                        key={category.title}
                        open={openItems[category.title]}
                        onOpenChange={() => toggleItem(category.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className={`flex items-center justify-between px-4 hover:bg-gray-100/80 cursor-pointer py-3 border-t border-gray-100 shape-category-title-${index}`}>
                            <div className={`flex items-center gap-2`}>
                              <span className="text-base text-gray-700">
                                {category.title}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({category.shapes.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 hover:bg-transparent",
                                  starredCategories.has(category.title) &&
                                    "text-yellow-400"
                                )}
                                onClick={(e) => toggleStar(category.title, e)}
                              >
                                {starredCategories.has(category.title) ? (
                                  <Star className="h-4 w-4 fill-current" />
                                ) : (
                                  <StarIcon className="h-4 w-4" />
                                )}
                              </Button>

                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  openItems[category.title] ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="py-2 px-4 grid grid-cols-3 gap-2">
                            {category.shapes.map((shape) => (
                              <div
                                key={shape.name}
                                className="flex flex-col items-center justify-center py-2 cursor-move hover:bg-gray-100 rounded px-2"
                                draggable
                                onDragStart={(e) =>
                                  handleShapeDragStart(e, shape?.type)
                                }
                                onClick={() => handleShapeClick(shape?.type)}
                              >
                                <div className="flex items-center justify-center h-10">
                                  {shape.component}
                                </div>
                                <span className="text-xs text-center line-clamp-1 mt-1">
                                  {shape.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </>
              )}

              {filteredCategories.length === 0 && (
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
      )}
    </aside>
  );
}
