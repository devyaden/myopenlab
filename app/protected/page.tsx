"use client";

import { HeaderSidebar } from "@/components/header-dashboard";
import { SidebarDashboard } from "@/components/sidebar-dashboard";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen  w-screen">
      <HeaderSidebar />

      <div className="flex flex-1 overflow-hidden">
        <SidebarDashboard />

        {/* Main area */}
        <main className="flex-grow overflow-auto">
          <div className=" p-4 sm:p-8 border-b border-gray-200 pb-8">
            <h2 className="text-xl sm:text-3xl mb-4 sm:mb-6">فتح مستند جديد</h2>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              <div className="flex flex-col items-center">
                <Button
                  variant="default"
                  className="py-16 w-32 h-32 bg-dark_background"
                >
                  <Plus className="text-6xl" />
                </Button>
                <p className="mt-2">مستند فارغ</p>{" "}
              </div>
              <div className="flex flex-col items-center">
                <Button variant="outline" className="py-16 text-lg w-32 h-32" />
                <p className="mt-2">قوالب</p>{" "}
              </div>
            </div>
          </div>
          <div className="pb-8">
            <h2 className="text-xl sm:text-3xl sm:mb-6 m-4 sm:m-8">
              فتح حديثًا
            </h2>
            <div>
              {[6, 5, 4, 3, 2, 1].map((num, index) => (
                <div
                  key={num}
                  className={`flex justify-between items-center py-2 px-4 sm:px-16 ${index % 2 === 0 ? "white" : "bg-light_background"}`}
                >
                  <span className="font-semibold text-sm sm:text-base ">
                    مستند {num}
                  </span>
                  <span className="text-gray-500 text-sm sm:text-base">
                    2024 jul {21 + num}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
