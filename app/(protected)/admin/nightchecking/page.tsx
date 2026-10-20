import { AdminNightCheckingClient } from "./components/AdminNightCheckingClient";

export const metadata = {
  title: "Night Checking Logs | GHCL Admin",
  description: "Historical master inspection database, bulk compliance deletion, and retention archiving.",
};

export default function AdminNightCheckingPage() {
  return <AdminNightCheckingClient />;
}

