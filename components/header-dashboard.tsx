"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUser } from "@/lib/contexts/userContext";
import { STORAGE_URL } from "@/utils/constants";
import {
  Bell,
  Crown,
  HelpCircle,
  LogOut,
  Menu,
  SlidersHorizontal,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";

export const HeaderSidebar = () => {
  const { signOut, user } = useUser();
  const { setOpenMobile } = useSidebar();
  const avatarUrl = STORAGE_URL + `avatars/` + user?.avatar_url;

  return (
    <header className="flex items-center justify-between gap-4 bg-yadn-dark-background px-6 z-50 py-4 min-w-full h-16">
      <div className="flex items-center gap-4 flex-1 ">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white/70 hover:bg-transparent hover:text-white"
          onClick={() => setOpenMobile(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open Sidebar</span>
        </Button>
        <Link
          href="/"
          className="flex items-center gap-2 justify-center !h-full"
        >
          <Image
            src="/assets/global/app-logo-white.svg"
            alt="Logo"
            width={32}
            height={16}
            className="h-6 w-full "
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
        {/* <div className="flex items-center gap-2">
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
        </div> */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={avatarUrl} alt="User" />
                <AvatarFallback className="bg-yadn-accent-green text-white text-2xl">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href={"/protected/profile"} className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            className="hidden items-center gap-2 bg-yadn-accent-dark-blue text-sm font-medium hover:bg-yadn-accent-dark-blue/90 sm:flex"
          >
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  );
};
