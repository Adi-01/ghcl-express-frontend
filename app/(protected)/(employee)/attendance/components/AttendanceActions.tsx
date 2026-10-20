"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  LogIn,
  LogOut,
  Loader2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  SITE_COORDINATES,
  MAX_ALLOWED_DISTANCE_METERS,
  getDistanceInMeters,
  WorkLocation,
  WORK_LOCATIONS,
} from "@/lib/location";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { cn } from "@/lib/utils";
import { ConfirmAttendanceDialog } from "./ConfirmAttendanceDialog";
import { LocationMap, formatDistance } from "./LocationMap";

interface AttendanceActionsProps {
  isActive: boolean;
  selectedLocation: WorkLocation | "";
  onLocationChange: (value: WorkLocation | "") => void;
  onPunch: (lat: number, lng: number) => void;
  isPending: boolean;
  cooldownUntil: string | null;
  checkInTime?: string | null;
}

export function AttendanceActions({
  isActive,
  selectedLocation,
  onLocationChange,
  onPunch,
  isPending,
  cooldownUntil,
  checkInTime,
}: AttendanceActionsProps) {
  const { isLocating, locationError, userCoords, retry } = useLiveLocation();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const currentSite = selectedLocation
    ? SITE_COORDINATES[selectedLocation as WorkLocation]
    : null;
  const currentRadius = selectedLocation
    ? MAX_ALLOWED_DISTANCE_METERS[selectedLocation as WorkLocation]
    : 0;

  useEffect(() => {
    if (!cooldownUntil) {
      setTimeLeft(null);
      return;
    }

    const targetMs = new Date(cooldownUntil).getTime();
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const isCoolingDown = Boolean(timeLeft);

  const distanceValidation = useMemo(() => {
    if (!userCoords || !currentSite) return { isOutside: false, message: null };

    const distance = getDistanceInMeters(
      userCoords.lat,
      userCoords.lng,
      currentSite.lat,
      currentSite.lng
    );

    if (distance > currentRadius) {
      return {
        isOutside: true,
        message: `You are ${formatDistance(distance)} away. You must be within ${formatDistance(currentRadius)} of ${selectedLocation} to punch.`,
      };
    }

    return { isOutside: false, message: null };
  }, [userCoords, currentSite, currentRadius, selectedLocation]);

  const handlePunchClick = () => {
    if (userCoords && !distanceValidation.isOutside) {
      setIsConfirmOpen(true);
    }
  };

  const executePunch = () => {
    if (userCoords && !distanceValidation.isOutside) {
      onPunch(userCoords.lat, userCoords.lng);
      setIsConfirmOpen(false);
    }
  };

  const displayError = locationError || distanceValidation.message;
  const isButtonDisabled =
    isPending ||
    isLocating ||
    Boolean(displayError) ||
    !userCoords ||
    !currentSite ||
    isCoolingDown ||
    (!isActive && !currentSite);

  return (
    <>
      <Card className="bg-[#121316] border-white/10 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Shift Punch</CardTitle>

          {/* Status Banner */}
          <div
            className={cn(
              "mt-2 rounded-lg px-4 py-3 flex items-center gap-3 border transition-colors",
              isActive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}
          >
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isActive ? "bg-emerald-400" : "bg-rose-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-3 w-3",
                  isActive ? "bg-emerald-500" : "bg-rose-500"
                )}
              />
            </span>

            <div className="space-y-0.5">
              <p className="font-bold text-sm leading-tight text-white">
                {isActive
                  ? "You are currently working"
                  : "You are currently not working"}
              </p>
              <p className="text-xs text-zinc-400">
                {isActive ? "आप काम पर हैं • તમે કામ પર છો" : "आप काम पर नहीं हैं • તમે કામ પર નથી"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Location selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              Work Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              {WORK_LOCATIONS.map((siteKey) => (
                <button
                  key={siteKey}
                  type="button"
                  disabled={isActive || isPending}
                  onClick={() => onLocationChange(siteKey)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-all flex items-center justify-between",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedLocation === siteKey
                      ? "border-primary bg-primary/10 text-white font-bold shadow-sm"
                      : "border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/80 hover:border-white/20"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{siteKey}</span>
                    <span className="text-[11px] text-zinc-500">
                      Radius: {MAX_ALLOWED_DISTANCE_METERS[siteKey]}m
                    </span>
                  </div>
                  {selectedLocation === siteKey && (
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {(selectedLocation || isActive) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Errors & Geofence violations */}
              {displayError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <span>{displayError}</span>
                  </div>
                  {locationError && (
                    <button
                      type="button"
                      onClick={retry}
                      disabled={isLocating}
                      className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold border border-rose-500/30 shrink-0 transition-colors disabled:opacity-50"
                    >
                      Retry GPS
                    </button>
                  )}
                </div>
              )}

              {/* Interactive Geofence Map Visualizer */}
              {currentSite && (
                <LocationMap
                  userCoords={userCoords}
                  siteCoords={currentSite}
                  siteRadius={currentRadius}
                  siteName={selectedLocation}
                  isLocating={isLocating}
                  locationError={locationError}
                  onRetry={retry}
                />
              )}

              {/* Action Button */}
              <Button
                size="lg"
                className={cn(
                  "w-full text-sm font-bold transition-all h-12 shadow-md",
                  isActive
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
                onClick={handlePunchClick}
                disabled={isButtonDisabled}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording Shift...
                  </>
                ) : isCoolingDown ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-pulse" />
                    Available in {timeLeft}
                  </>
                ) : isActive ? (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Check Out
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Check In
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmAttendanceDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executePunch}
        isCheckout={isActive}
        isBusy={isPending}
        location={selectedLocation || undefined}
        checkInTime={checkInTime}
      />
    </>
  );
}

