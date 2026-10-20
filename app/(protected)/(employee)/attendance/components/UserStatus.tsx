"use client";

import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";

interface UserStatusProps {
  isActive: boolean;
}

export function UserStatus({ isActive }: UserStatusProps) {
  const { data: profile } = useProfileQuery();
  const displayName = profile?.username || profile?.email || "Employee";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#121316] rounded-xl border border-white/10 shadow-sm">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Welcome back, {displayName}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {isActive ? "You are currently checked in." : "Ready for your shift?"}
        </p>
      </div>
      <div className="flex items-center gap-2.5 bg-zinc-900/80 px-4 py-2 rounded-full border border-white/10 self-start sm:self-auto">
        <span className="relative flex h-2.5 w-2.5">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-zinc-500"
            }`}
          ></span>
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-emerald-400" : "text-zinc-400"}`}>
          {isActive ? "Working" : "Not Working"}
        </span>
      </div>
    </div>
  );
}
