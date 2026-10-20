import { Metadata } from "next";
import { AdminAttendanceClient } from "./components/AdminAttendanceClient";

export const metadata: Metadata = {
  title: "Attendance Management | GHCL Admin",
  description: "Global shift logs, monthly register matrix, and data management for workforce attendance.",
};

export default function AdminAttendancePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <AdminAttendanceClient />
    </div>
  );
}

