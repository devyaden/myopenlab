"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Crown, HelpCircle, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const HeaderSidebar = () => {
  return (
    <header className="flex items-center justify-between gap-4 bg-yadn-dark-background px-6 z-50 py-4">
      <div className="flex items-center gap-4 flex-1">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/global/app-logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-full"
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
            className="hidden items-center gap-2 bg-yadn-button-blue text-sm font-medium hover:bg-yadn-button-blue/90 sm:flex"
          >
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
};
