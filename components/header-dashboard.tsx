// components/Header.tsx
// "use client";

// import { Button } from "@/components/ui/button";
// import { SidebarTrigger } from "@/components/ui/sidebar";
// import { Menu, Search } from "lucide-react";
// import { useState } from "react";
// import { AccountPopover } from "./account-popover";
// import { InputWithIcon } from "./input-with-icon";

// export const HeaderSidebar = () => {
//   const [profileOpen, setProfileOpen] = useState(false);

//   return (
//     <header className=" bg-dark_background p-4 flex justify-between items-center z-50">
//       <div className="flex items-center space-x-4 space-x-reverse flex-1">
//         <SidebarTrigger>
//           <Button variant="ghost" size="icon" className="lg:hidden">
//             <Menu className="h-6 w-6" />
//           </Button>
//         </SidebarTrigger>
//         <span className="font-bold hidden sm:inline">Logo</span>
//       </div>

//       <div className="flex-grow mx-4 hidden sm:block">
//         <InputWithIcon
//           type="search"
//           placeholder="بحث..."
//           className=" bg-white placeholder-gray-400"
//           icon={<Search className=" text-black h-5 w-5" />}
//         />
//       </div>

//       <div className="flex-1 justify-end flex ">
//         <AccountPopover
//           profileOpen={profileOpen}
//           setProfileOpen={setProfileOpen}
//         />
//       </div>
//     </header>
//   );
// };

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Crown, HelpCircle, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const HeaderSidebar = () => {
  return (
    <header className="flex h-14 items-center justify-between gap-4 bg-[#252525] px-6 z-50">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/assets/global/app-logo.png"
          alt="Logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      </Link>

      <div className="relative hidden flex-1 max-w-xl md:block">
        <div className="flex items-center">
          <Input
            placeholder="Search"
            className="rounded-md bg-white/[0.08] text-white placeholder:text-white/70"
          />
          <div className="absolute right-0 flex h-full items-center">
            <div className="h-5 w-px bg-white/20" />
            <Button
              size="icon"
              variant="ghost"
              className="ml-2 h-full px-3 text-white/70 hover:bg-transparent hover:text-white"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filters</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-white/70 hover:bg-transparent hover:text-white"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/70 hover:bg-transparent hover:text-white"
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            className="hidden items-center gap-2 bg-[#3c41c2] text-sm font-medium hover:bg-[#3c41c2]/90 sm:flex"
          >
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
};
