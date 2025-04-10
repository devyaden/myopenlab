"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  Info,
  FileText,
  MoreVertical,
  Plus,
  Trash,
  Edit,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  date: string;
  type: string;
}

export function RecentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);

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

  return (
    <div className="w-full  bg-white p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <h2 className="text-xl font-medium text-gray-900">
            Recent Documents
          </h2>
          <div className="absolute bottom-0 left-0 right-0 border-b border-dotted border-gray-300" />
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>New Document</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                <span>Download All</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
                <span className="sr-only">Information</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">
                    About Recent Documents
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This section displays your most recently accessed documents
                    and canvases. Items are automatically added here when you
                    create, edit, or open them.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="flex items-center p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <Link href={doc?.type === "Canvas" ? `/canvas/${doc.id}` : "#"}>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {doc.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{doc.date}</span>
                  <span>•</span>
                  <span>{doc?.type}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">
                      More options for {doc.title}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(doc.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
