import { AdminBulkerClient } from "./components/AdminBulkerClient";

export const metadata = {
  title: "Bulker Management | GHCL Admin",
  description: "Historical dispatch audit logs, truck fleet permits, and verified customer destinations.",
};

export default function AdminBulkerPage() {
  return <AdminBulkerClient />;
}

