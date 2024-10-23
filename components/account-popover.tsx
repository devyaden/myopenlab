"use client";

import { signOutAction } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface AccountPopoverProps {
  profileOpen: boolean;
  setProfileOpen: (isOpen: boolean) => void;
}

export const AccountPopover: React.FC<AccountPopoverProps> = ({
  profileOpen,
  setProfileOpen,
}) => {
  return (
    <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen} dir="rtl">
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full flex-1"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-black text-white">Y</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-6 ml-6 rounded-lg" forceMount>
        <div className="flex items-center ">
          <Avatar className="h-12 w-12">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-black text-white">Y</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 mr-2">
            <p className=" text-lg font-semibold leading-none">يمان رضا</p>
            <p className="text-xs leading-none text-muted-foreground">
              yaman.reda@gmail.com
            </p>
          </div>
        </div>

        <div className=" pt-8">
          <DropdownMenuItem>
            <Link href="/protected/profile" className="flex items-center">
              <Settings className="ml-4 h-4 w-4" aria-hidden="true" />
              <span>الإعدادات الشخصية</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOutAction()}>
            <LogOut className="ml-4 h-4 w-4" aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
