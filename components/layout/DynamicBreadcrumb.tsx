"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_MAP: Record<string, { section: string; title: string }> = {
  "/profile": { section: "Profile", title: "Manage Profile" },
  "/my-documents": { section: "Profile", title: "Manage Documents" },
  "/bulkerentries": { section: "Bulker Logistics", title: "Dispatch Lifecycle" },
  "/admin/users": { section: "Admin", title: "Manage Users" },
  "/admin/documents": { section: "Admin", title: "Manage Documents" },
  "/admin/bulker": { section: "Admin", title: "Bulker Master Registry" },
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const route = ROUTE_MAP[pathname] || {
    section: "Application",
    title: pathname.replace("/", "").replace(/-/g, " ") || "Dashboard",
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#" className="capitalize text-muted-foreground hover:text-white">
            {route.section}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage className="capitalize text-white font-medium">
            {route.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

