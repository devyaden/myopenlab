import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";

export function DiagramsSection() {
  const templates = [
    {
      title: "Flowchart",
      icon: "/assets/dashboard/flowchart_1.svg",
    },
    {
      title: "Mind Map",
      icon: "/assets/dashboard/flowchart_2.svg",
    },
    {
      title: "Business Process",
      icon: "/assets/dashboard/flowchart_3.svg",
    },
    {
      title: "ORG Chart",
      icon: "/assets/dashboard/flowchart_4.svg",
    },
    {
      title: "Concept Map",
      icon: "/assets/dashboard/flowchart_5.svg",
    },
    {
      title: "Database ER Diagram",
      icon: "/assets/dashboard/flowchart_6.svg",
    },
    {
      title: "Use Case",
      icon: "/assets/dashboard/flowchart_7.svg",
    },
  ];

  return (
    <div className="bg-yadn-primary-gray">
      <div className="px-4 md:px-8 py-4 md:py-8">
        <h1 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">
          Jumping Into Something New
        </h1>

        <div className="">
          <ScrollArea className="w-full whitespace-nowrap rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 pb-4">
              {templates.map((template) => (
                <Card
                  key={template.title}
                  className="shrink-0 p-4 cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-between">
                    <p className="text-sm text-center mb-2">{template.title}</p>

                    <Image
                      src={template.icon}
                      alt={template.title}
                      height={10}
                      width={10}
                      className="h-full w-auto"
                    />
                  </div>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
