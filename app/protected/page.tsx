"use client";

import { SidebarDashboard } from "@/components/dashboard-sidebar";
import { HeaderSidebar } from "@/components/header-dashboard";
import { Button } from "@/components/ui/button";

import { Plus } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [recentlyOpened, setRecentlyOpened] = useState<any>([]);

  const fetchRecentlyOpened = async () => {
    const recentlyOpened = localStorage.getItem("recentlyOpenedCanvases");
    if (!recentlyOpened) return;
    setRecentlyOpened(JSON.parse(recentlyOpened));
  };

  useEffect(() => {
    fetchRecentlyOpened();
  }, []);

  return (
    <div className="flex flex-col h-screen  w-screen">
      <HeaderSidebar />

      <div className="flex flex-1 overflow-hidden">
        <SidebarDashboard />

        <main className="flex-grow overflow-auto">
          {/* <div className=" p-4 sm:p-8 border-b border-gray-200 pb-8">
            <h2 className="text-xl sm:text-3xl mb-4 sm:mb-6">فتح مستند جديد</h2>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              <Link
                className="flex flex-col items-center"
                href="/protected/canvas/new"
              >
                <Button
                  variant="default"
                  className="py-16 w-32 h-32 bg-dark_background"
                >
                  <Plus className="text-6xl" />
                </Button>
                <p className="mt-2">مستند فارغ</p>{" "}
              </Link>
              <div className="flex flex-col items-center">
                <Button variant="outline" className="py-16 text-lg w-32 h-32" />
                <p className="mt-2">قوالب</p>{" "}
              </div>
            </div>
          </div> */}
          <div className="pb-8">
            <h2 className="text-xl sm:text-3xl sm:mb-6 m-4 sm:m-8">
              فتح حديثًا
            </h2>
            <div>
              {recentlyOpened.map((canvas: any, index: number) => (
                <div
                  key={canvas?.id}
                  className={`flex justify-between items-center py-2 px-4 sm:px-16 ${index % 2 === 0 ? "white" : "bg-light_background"}`}
                >
                  <span className="font-semibold text-sm sm:text-base ">
                    {canvas?.name}
                  </span>
                  <span className="text-gray-500 text-sm sm:text-base">
                    {moment(canvas?.openedAt).fromNow()}
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
