"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, MapPin } from "lucide-react";
import type { UserRecentAttendance } from "@/lib/types/attendance";
import { format, parseISO } from "date-fns";

const formatTime = (isoString?: string | null) => {
  if (!isoString) return "-";
  try {
    return format(parseISO(isoString), "hh:mm a");
  } catch {
    return isoString;
  }
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
};

interface RecentHistoryProps {
  records: UserRecentAttendance[];
}

export function RecentHistory({ records }: RecentHistoryProps) {
  return (
    <Card className="bg-[#121316] border-white/10 text-white h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Shifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-sm">
            No completed shifts recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => {
              const inStr = formatTime(record.check_in_time || record.checkInTime);
              const outStr = formatTime(record.check_out_time || record.checkOutTime);
              const dateDisplay = formatDate(
                record.attendance_date || record.attendanceDate || record.check_in_time
              );

              return (
                <div key={record.id || index}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {dateDisplay}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {record.worklocation}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end text-sm">
                      <span className="font-mono text-zinc-300 text-xs sm:text-sm">
                        {inStr} – {outStr}
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold mt-0.5">
                        {record.duration}
                      </span>
                    </div>
                  </div>
                  {index < records.length - 1 && (
                    <Separator className="bg-white/5 my-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

