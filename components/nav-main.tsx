"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, type LucideIcon } from "lucide-react";

export interface NavMainItem {
  title: string;
  url?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  }[];
}

export function NavMain({
  items,
  label = "Navigation",
}: {
  items: NavMainItem[];
  label?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive =
            item.isActive !== undefined
              ? item.isActive
              : (item.url ? pathname === item.url : false) ||
                (item.items?.some((sub) => pathname === sub.url) || false);

          const IconComponent = item.icon as any;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {IconComponent && (
                      typeof IconComponent === "function" || typeof IconComponent === "object" && "render" in IconComponent ? (
                        <IconComponent className="w-4 h-4" />
                      ) : (
                        IconComponent
                      )
                    )}
                    <span className="font-medium text-sm">{item.title}</span>
                    <ChevronRightIcon className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubActive}>
                            <Link href={subItem.url} className={isSubActive ? "text-white font-medium" : "text-muted-foreground"}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
