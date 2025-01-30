import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function DiagramsSection() {
  const templates = [
    {
      title: "Flowchart",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="20"
            y="20"
            width="20"
            height="20"
            className="fill-emerald-400"
          />
          <rect
            x="60"
            y="20"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <path d="M40 30H60" className="stroke-gray-400 stroke-2" />
          <polygon points="45,40 55,40 50,50" className="fill-gray-400" />
        </svg>
      ),
    },
    {
      title: "Mind Map",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="40"
            y="20"
            width="20"
            height="20"
            className="fill-pink-400"
          />
          <rect
            x="20"
            y="60"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <rect
            x="60"
            y="60"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <path
            d="M50 40L30 60M50 40L70 60"
            className="stroke-gray-400 stroke-2"
          />
        </svg>
      ),
    },
    {
      title: "Business Process",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="20"
            y="20"
            width="60"
            height="15"
            className="fill-blue-400"
          />
          <rect
            x="20"
            y="42.5"
            width="60"
            height="15"
            className="fill-pink-400"
          />
          <rect
            x="20"
            y="65"
            width="60"
            height="15"
            className="fill-blue-400"
          />
          <path
            d="M50 35L50 42.5M50 57.5L50 65"
            className="stroke-gray-400 stroke-2"
          />
        </svg>
      ),
    },
    {
      title: "ORG Chart",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="40"
            y="20"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <rect
            x="20"
            y="60"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <rect
            x="60"
            y="60"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <path
            d="M50 40L50 50M30 60L70 60M30 50L70 50"
            className="stroke-gray-400 stroke-2"
          />
        </svg>
      ),
    },
    {
      title: "Concept Map",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="20"
            y="40"
            width="20"
            height="20"
            className="fill-purple-400"
          />
          <rect
            x="40"
            y="40"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <rect
            x="60"
            y="40"
            width="20"
            height="20"
            className="fill-pink-400"
          />
          <path d="M40 50L60 50" className="stroke-gray-400 stroke-2" />
        </svg>
      ),
    },
    {
      title: "Database ER Diagram",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="20"
            y="40"
            width="20"
            height="20"
            className="fill-blue-400"
          />
          <rect
            x="60"
            y="40"
            width="20"
            height="20"
            className="fill-pink-400"
          />
          <path
            d="M40 50L60 50"
            className="stroke-gray-400 stroke-2"
            strokeDasharray="4"
          />
        </svg>
      ),
    },
    {
      title: "Use Case",
      icon: (
        <svg
          className="w-12 h-12 md:w-16 md:h-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="30" cy="50" r="5" className="fill-blue-400" />
          <circle cx="70" cy="50" r="5" className="fill-blue-400" />
          <rect
            x="40"
            y="30"
            width="20"
            height="40"
            className="fill-blue-200"
            rx="10"
          />
          <path
            d="M30 50L40 50M60 50L70 50"
            className="stroke-gray-400 stroke-2"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-[#ffdef5]">
      <div className="px-4 md:px-8 py-4 md:py-8">
        <h1 className="text-lg md:text-xl font-semibold text-[#344054] mb-4 md:mb-6">
          Jumping Into Something New
        </h1>

        {/* Mobile View (Grid) */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {templates.map((template) => (
            <Card key={template.title} className="p-3">
              <div className="flex flex-col items-center">
                <p className="text-xs text-[#344054] text-center">
                  {template.title}
                </p>
                <div className="mb-2">{template.icon}</div>
              </div>
            </Card>
          ))}
          <div className="col-span-2 flex flex-col space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-9"
              size="sm"
            >
              <Plus className="mr-2 h-3 w-3" />
              <span className="text-xs">More Templates</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-9"
              size="sm"
            >
              <Plus className="mr-2 h-3 w-3" />
              <span className="text-xs">Blank Whiteboard</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-9"
              size="sm"
            >
              <Plus className="mr-2 h-3 w-3" />
              <span className="text-xs">Blank Diagram</span>
            </Button>
          </div>
        </div>

        {/* Desktop View (Horizontal Scroll) */}
        <div className="hidden md:block">
          <ScrollArea className="w-full whitespace-nowrap rounded-lg">
            <div className="flex space-x-4 pb-4">
              {templates.map((template) => (
                <Card key={template.title} className="w-[140px] shrink-0 p-4">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-[#344054] text-center">
                      {template.title}
                    </p>
                    <div className="mb-2">{template.icon}</div>
                  </div>
                </Card>
              ))}

              <div className="flex flex-col space-y-4">
                <Button variant="outline" className="justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  More Templates
                </Button>
                <Button variant="outline" className="justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Blank Whiteboard
                </Button>
                <Button variant="outline" className="justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Blank Diagram
                </Button>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
