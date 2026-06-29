"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FileText,
  FolderClosed,
  Library,
  Map as MapIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Table2,
  Trash2,
  Workflow,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarStore } from "@/lib/store/useSidebar";
import { triggerExplore } from "@/components/explore/iris";

const emit = (name: string, detail?: any) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));

const TYPE_FILTERS = [
  { type: "hybrid", label: "Playbooks", icon: Workflow, token: "--node-hybrid" },
  { type: "table", label: "Tables", icon: Table2, token: "--node-table" },
  {
    type: "document",
    label: "Documents",
    icon: FileText,
    token: "--node-document",
  },
] as const;

/**
 * The Atlas Library sidebar — the persistent left nav: Create new · Library · The
 * Map · type filters · Collections. Collections are folders demoted to an optional
 * grouping (no "Root"). CRUD is delegated to the AppShell via window events.
 */
export function LibrarySidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeType = params.get("type");
  const folders = useSidebarStore((s) => s.folders);

  const onLibrary = pathname === "/protected";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/protected"
          className="flex h-10 items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center"
        >
          <Image
            src="/assets/global/app-logo.svg"
            alt="Olab"
            width={28}
            height={28}
            className="h-6 w-auto dark:hidden"
          />
          <Image
            src="/assets/global/app-logo-white.svg"
            alt="Olab"
            width={28}
            height={28}
            className="hidden h-6 w-auto dark:block"
          />
          <span className="font-display text-base font-semibold group-data-[collapsible=icon]:hidden">
            Olab
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => emit("olab:create-new", { type: "canvas" })}
                  className="bg-signal text-white hover:bg-signal-hover hover:text-white"
                  tooltip="Create new"
                >
                  <Plus />
                  <span>Create new</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onLibrary && !activeType}
                  tooltip="Library"
                >
                  <Link href="/protected">
                    <Library />
                    <span>Library</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => triggerExplore()}
                  tooltip="The Map"
                >
                  <MapIcon />
                  <span>The Map</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Types</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TYPE_FILTERS.map((f) => (
                <SidebarMenuItem key={f.type}>
                  <SidebarMenuButton
                    asChild
                    isActive={onLibrary && activeType === f.type}
                    tooltip={f.label}
                  >
                    <Link href={`/protected?type=${f.type}`}>
                      <f.icon style={{ color: `hsl(var(${f.token}))` }} />
                      <span>{f.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupAction
            title="New collection"
            onClick={() => emit("olab:create-new", { type: "folder" })}
          >
            <Plus /> <span className="sr-only">New collection</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No collections yet.
                </p>
              )}
              {folders.map((f) => (
                <SidebarMenuItem key={f.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/protected/folder/${f.id}`}
                    tooltip={f.name}
                  >
                    <Link href={`/protected/folder/${f.id}`}>
                      <FolderClosed />
                      <span className="truncate">{f.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        onClick={() =>
                          emit("olab:rename-item", {
                            id: f.id,
                            name: f.name,
                            kind: "folder",
                          })
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          emit("olab:delete-item", {
                            id: f.id,
                            name: f.name,
                            kind: "folder",
                          })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/protected/profile">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default LibrarySidebar;
