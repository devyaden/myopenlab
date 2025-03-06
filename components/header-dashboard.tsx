"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Crown,
  HelpCircle,
  LogOut,
  SlidersHorizontal,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/contexts/userContext";

export const HeaderSidebar = () => {
  const { signOut } = useUser();

  return (
    <header className="flex items-center justify-between gap-4 bg-yadn-dark-background px-6 z-50 py-4">
      <div className="flex items-center gap-4 flex-1">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/global/app-logo-white.svg"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage
                  src="/placeholder.svg?height=32&width=32"
                  alt="User"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
