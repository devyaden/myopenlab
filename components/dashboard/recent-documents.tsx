"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  MoreVertical,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Document {
  id: string;
  title: string;
  date: string;
  type: string;
}

export function RecentDocuments({
  handleToggleSidebar,
}: {
  handleToggleSidebar?: (show: boolean) => void;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);

  const getDocumentTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "document":
        return " bg-yadn-accent-pink";
      case "hybrid":
        return " bg-yadn-accent-dark-orange";
      case "table":
        return "bg-yadn-accent-dark-orange";
      default:
        return "bg-yadn-accent-blue";
    }
  };

  useEffect(() => {
    const savedDocuments = localStorage.getItem("recentDocuments");
    if (savedDocuments) {
      setDocuments(JSON.parse(savedDocuments));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== id);
    setDocuments(updatedDocuments);
    localStorage.setItem("recentDocuments", JSON.stringify(updatedDocuments));
  };

  const handleNavigate = (id: string, canvasType: string) => {
    if (canvasType === "document") {
      window.location.href = `/protected/document-editor/${id}`;
    } else {
      window.location.href = `/protected/canvas-new/${id}`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {handleToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute top-2 left-2"
          onClick={() => handleToggleSidebar(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      <div className="p-6 pb-3 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between mb-3 pt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Recent</h2>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
                <span className="sr-only">Information</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Recent Documents</h4>
                <p className="text-sm text-muted-foreground">
                  Your most recently accessed documents and canvases appear here
                  automatically.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ScrollArea className="flex-grow px-6">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-500">
            <FileText className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">No recent documents</p>
            <p className="text-xs text-gray-400 mt-1">
              Recently opened files will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="flex items-center p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleNavigate(doc.id, doc.type)}
              >
                <div
                  className={`h-9 w-9 rounded-lg ${getDocumentTypeColor(doc.type)} flex items-center justify-center mr-3 flex-shrink-0`}
                >
                  <FileText className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="truncate">{doc.date}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">
                        More options for {doc.title}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Remove from recent</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
