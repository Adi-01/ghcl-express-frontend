import { Metadata } from "next";
import { AttendanceDashboardClient } from "./components/AttendanceDashboardClient";

export const metadata: Metadata = {
  title: "Mark Attendance | GHCL Operations",
  description: "Employee geo-fenced attendance marking and shift tracking dashboard.",
};

export default function AttendancePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <AttendanceDashboardClient />
    </div>
  );
}

