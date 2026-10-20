"use client";

import { useState, useEffect } from "react";
import { UserStatus } from "./UserStatus";
import { AttendanceActions } from "./AttendanceActions";
import { RecentHistory } from "./RecentHistory";
import { useAttendanceStatusQuery } from "@/lib/hooks/queries/useAttendanceQuery";
import { usePunchAttendanceMutation } from "@/lib/hooks/mutations/useAttendanceMutations";
import { WorkLocation } from "@/lib/location";
import { Loader2 } from "lucide-react";

export function AttendanceDashboardClient() {
  const { data, isLoading, isError } = useAttendanceStatusQuery();
  const punchMutation = usePunchAttendanceMutation();

  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | "">("GHCL");

  const isActive = Boolean(data?.is_active ?? data?.isActive);
  const activeShift = data?.active_shift ?? data?.activeShift;
  const recentHistory = data?.recent_history ?? data?.recentHistory ?? [];
  const cooldownUntil = data?.cooldown_until ?? data?.cooldownUntil ?? null;

  // Sync selected location with active shift when working
  useEffect(() => {
    if (activeShift?.worklocation) {
      setSelectedLocation(activeShift.worklocation as WorkLocation);
    }
  }, [activeShift]);

  const handlePunch = (lat: number, lng: number) => {
    punchMutation.mutate({
      worklocation: selectedLocation || undefined,
      latitude: lat,
      longitude: lng,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-300">
        <p className="font-semibold text-base">Failed to load attendance status.</p>
        <p className="text-sm mt-1 text-zinc-400">Please check your network and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserStatus isActive={isActive} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AttendanceActions
            isActive={isActive}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onPunch={handlePunch}
            isPending={punchMutation.isPending}
            cooldownUntil={cooldownUntil}
            checkInTime={activeShift?.check_in_time || activeShift?.checkInTime}
          />
        </div>
        <div className="lg:col-span-5">
          <RecentHistory records={recentHistory} />
        </div>
      </div>
    </div>
  );
}

