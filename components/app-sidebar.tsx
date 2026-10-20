"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_ITEMS, hasNavAccess } from "@/lib/config/navigation";
import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useProfileQuery(false);

  const isAdmin = Boolean(
    user?.is_admin ||
    user?.role === "ADMIN" ||
    user?.labels?.some((l) => ["ADMIN", "SUPERADMIN"].includes(String(l).toUpperCase()))
  );

  const navItems = NAV_ITEMS.filter((item) =>
    hasNavAccess(item.allowedRoles, isAdmin, user?.labels || [])
  ).map((item) => ({
    title: item.label,
    icon: item.icon,
    items: item.children
      ?.filter((child) => hasNavAccess(child.allowedRoles, isAdmin, user?.labels || []))
      .map((child) => ({
        title: child.label,
        url: child.href || "#",
        icon: child.icon,
      })),
  }));


  const currentUser = {
    name: user?.username || (user?.email ? user.email.split("@")[0] : "User"),
    email: user?.email || "loading...",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-black font-bold text-xs tracking-wider">
                GH
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">GHCL Ops</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isAdmin ? "Admin Console" : "Employee Portal"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} label="Operations" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
