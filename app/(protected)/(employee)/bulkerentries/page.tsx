import BulkerEntriesClient from "./components/BulkerEntriesClient";

export const metadata = {
  title: "Bulker Dispatch Lifecycle | GHCL",
  description: "Real-time bulker truck queue, allocation, and gate-out lifecycle.",
};

export default function BulkerEntriesPage() {
  return <BulkerEntriesClient />;
}

