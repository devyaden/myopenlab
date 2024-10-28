"use client";

import Canvas from "@/components/canvas/Canvas";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("My Canvas");

  const router = useRouter();

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Arrow */}
            <button
              className="hover:bg-gray-100 p-2 rounded-full"
              onClick={() => router.back()}
            >
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </button>

            {/* Company Logo */}
            <div className="flex items-center">
              {/* Replace with your actual logo */}
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
            </div>

            {/* Editable Title */}
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 w-48"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditing(false)}
                    className="hover:bg-gray-100 p-2 rounded-full"
                  >
                    <Check className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-gray-100 p-2 rounded-full"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Canvas />
    </div>
  );
}
