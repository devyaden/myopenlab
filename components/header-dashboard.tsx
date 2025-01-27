// components/Header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { AccountPopover } from "./account-popover";
import { InputWithIcon } from "./input-with-icon";

export const HeaderSidebar = () => {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className=" bg-dark_background p-4 flex justify-between items-center z-50">
      <div className="flex items-center space-x-4 space-x-reverse flex-1">
        <SidebarTrigger>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SidebarTrigger>
        <span className="font-bold hidden sm:inline">Logo</span>
      </div>

      <div className="flex-grow mx-4 hidden sm:block">
        <InputWithIcon
          type="search"
          placeholder="بحث..."
          className=" bg-white placeholder-gray-400"
          icon={<Search className=" text-black h-5 w-5" />}
        />
      </div>

      <div className="flex-1 justify-end flex ">
        <AccountPopover
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
        />
      </div>
    </header>
  );
};
