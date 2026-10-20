"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SITE_COORDINATES, WorkLocation } from "@/lib/location";
import type { AttendanceLog, UpdateAdminAttendancePayload } from "@/lib/types/attendance";
import { toast } from "sonner";

interface EditModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  log: AttendanceLog | null;
  onSave: (id: string, payload: UpdateAdminAttendancePayload) => void;
  isBusy: boolean;
}

const toLocalInputFormat = (isoString: string | null) => {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
};

const toISOFormat = (localString: string | null | undefined) => {
  if (!localString) return null;
  return new Date(localString).toISOString();
};

export function AdminAttendanceEditModal({
  isOpen,
  onClose,
  log,
  onSave,
  isBusy,
}: EditModalProps) {
  const [worklocation, setWorklocation] = useState<string>("GHCL");
  const [outLocation, setOutLocation] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  useEffect(() => {
    if (log && isOpen) {
      setWorklocation(log.worklocation || "GHCL");
      setOutLocation(log.out_latitude || log.outLatitude ? log.worklocation : "");
      setCheckInTime(toLocalInputFormat(log.check_in_time || log.checkInTime));
      setCheckOutTime(toLocalInputFormat(log.check_out_time || log.checkOutTime));
    }
  }, [log, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!log) return;

    if (!worklocation) {
      toast.error("In Location is required.");
      return;
    }

    if (outLocation && outLocation !== worklocation) {
      toast.error("Out location must match In location.");
      return;
    }

    const inCoords = SITE_COORDINATES[worklocation as WorkLocation];
    const outCoords = outLocation
      ? SITE_COORDINATES[outLocation as WorkLocation]
      : null;

    onSave(log.id, {
      worklocation,
      check_in_time: toISOFormat(checkInTime) || undefined,
      checkInTime: toISOFormat(checkInTime) || undefined,
      check_out_time: toISOFormat(checkOutTime),
      checkOutTime: toISOFormat(checkOutTime),
      in_latitude: inCoords ? String(inCoords.lat) : null,
      in_longitude: inCoords ? String(inCoords.lng) : null,
      out_latitude: outCoords ? String(outCoords.lat) : null,
      out_longitude: outCoords ? String(outCoords.lng) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-6 sm:p-8 border-border shadow-xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Edit Attendance Record
          </DialogTitle>
          {log && (
            <p className="text-sm text-muted-foreground mt-1">
              For {log.user_name || log.userName}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">In Location</label>
              <Select
                value={worklocation}
                onValueChange={(val) => setWorklocation(val)}
              >
                <SelectTrigger className="bg-transparent w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHCL">GHCL</SelectItem>
                  <SelectItem value="Kajli">Kajli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Out Location</label>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Optional
                </span>
              </div>
              <Select
                value={outLocation}
                onValueChange={(val) => setOutLocation(val === "none" ? "" : val)}
              >
                <SelectTrigger className="bg-transparent w-full">
                  <SelectValue placeholder="Select out location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Active)</SelectItem>
                  <SelectItem value="GHCL">GHCL</SelectItem>
                  <SelectItem value="Kajli">Kajli</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Check-In Time</label>
              <Input
                type="datetime-local"
                className="bg-transparent"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Check-Out Time</label>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Optional
                </span>
              </div>
              <Input
                type="datetime-local"
                className="bg-transparent"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-border">
            <Button type="submit" className="w-full" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

