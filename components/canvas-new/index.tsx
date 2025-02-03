"use client";

import { Header } from "./header";
import { Toolbar } from "./toolbar";
import { Sidebar } from "./sidebar";
import { VerticalNav } from "./vertical-nav";

export default function CanvasNew() {
  return (
    <div className="min-h-screen bg-white w-screen">
      {/* Top Navigation */}
      <header className="border-b border-gray-200">
        <Header />
        {/* Toolbar */}
        <Toolbar />
      </header>

      <div className="flex">
        {/* Left Icon Bar - Now starts below header */}
        <VerticalNav />

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Left Sidebar */}
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
