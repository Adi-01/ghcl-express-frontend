import {
  CircleUser,
  Settings,
  Users,
  FileCheck,
  UserCircle,
  FileText,
  Truck,
  Moon,
  Clock,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

export type Role =
  | "admin"
  | "employee"
  | "bulker"
  | "bulker-viewer"
  | "ghcl"
  | "ghcl-viewer"
  | string;

export interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  allowedRoles: Role[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Profile",
    icon: CircleUser,
    allowedRoles: ["admin", "employee"],
    children: [
      {
        href: "/profile",
        label: "Manage Profile",
        icon: UserCircle,
        allowedRoles: ["admin", "employee"],
      },
      {
        href: "/my-documents",
        label: "Manage Documents",
        icon: FileText,
        allowedRoles: ["admin", "employee"],
      },
    ],
  },
  {
    label: "Operations",
    icon: Truck,
    allowedRoles: [
      "admin",
      "employee",
      "bulker",
      "bulker-viewer",
      "ghcl",
      "ghcl-viewer",
      "attend",
    ],
    children: [
      {
        href: "/bulkerentries",
        label: "Bulker Dispatch",
        icon: Truck,
        allowedRoles: ["admin", "bulker", "bulker-viewer"],
      },
      {
        href: "/nightchecking",
        label: "Night Checking",
        icon: Moon,
        allowedRoles: ["admin", "ghcl", "ghcl-viewer"],
      },
      {
        href: "/attendance",
        label: "Mark Attendance",
        icon: Clock,
        allowedRoles: ["attend"],
      },
    ],
  },
  {
    label: "Admin",
    icon: Settings,
    allowedRoles: ["admin"],
    children: [
      {
        href: "/admin/users",
        label: "Manage Users",
        icon: Users,
        allowedRoles: ["admin"],
      },
      {
        href: "/admin/documents",
        label: "Manage User Documents",
        icon: FileCheck,
        allowedRoles: ["admin"],
      },
      {
        href: "/admin/bulker",
        label: "Bulker Management",
        icon: Truck,
        allowedRoles: ["admin"],
      },
      {
        href: "/admin/nightchecking",
        label: "Night Checking Logs",
        icon: Moon,
        allowedRoles: ["admin"],
      },
      {
        href: "/admin/attendance",
        label: "Attendance Management",
        icon: CalendarCheck,
        allowedRoles: ["admin", "attend-viewer"],
      },
    ],
  },
];

export function hasNavAccess(
  allowedRoles: Role[],
  isAdmin: boolean,
  userLabels: string[] = []
): boolean {
  const labelsUpper = new Set(userLabels.map((l) => String(l).toUpperCase()));
  // Personal attendance marking requires ATTEND label (for both admins and employees)
  if (allowedRoles.includes("attend") && !allowedRoles.includes("admin")) {
    return labelsUpper.has("ATTEND");
  }
  if (isAdmin) return true;
  if (allowedRoles.includes("employee")) return true;
  if (allowedRoles.includes("attend") && labelsUpper.has("ATTEND")) return true;
  if (allowedRoles.includes("bulker") && labelsUpper.has("BULKER")) return true;
  if (allowedRoles.includes("bulker-viewer") && labelsUpper.has("BULKER-VIEWER")) return true;
  if (allowedRoles.includes("ghcl") && (labelsUpper.has("GHCL") || labelsUpper.has("NIGHTCHECKING"))) return true;
  if (allowedRoles.includes("ghcl-viewer") && (labelsUpper.has("GHCL-VIEWER") || labelsUpper.has("NIGHTCHECKING-VIEWER"))) return true;
  if (allowedRoles.includes("attend-viewer") && labelsUpper.has("ATTEND-VIEWER")) return true;
  return false;
}
