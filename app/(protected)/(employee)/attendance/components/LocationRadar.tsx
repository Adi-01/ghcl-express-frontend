"use client";

import { useMemo } from "react";
import { Navigation, MapPin, ExternalLink } from "lucide-react";
import { WorkLocation, getDistanceInMeters } from "@/lib/location";

interface LocationRadarProps {
  userCoords: { lat: number; lng: number } | null;
  siteCoords: { lat: number; lng: number } | null;
  siteRadius: number;
  siteName: WorkLocation | string;
}

export function LocationRadar({
  userCoords,
  siteCoords,
  siteRadius,
  siteName,
}: LocationRadarProps) {
  const distance = useMemo(() => {
    if (!userCoords || !siteCoords) return null;
    return getDistanceInMeters(
      userCoords.lat,
      userCoords.lng,
      siteCoords.lat,
      siteCoords.lng
    );
  }, [userCoords, siteCoords]);

  const isInside = distance !== null && distance <= siteRadius;

  // Normalized relative coordinate calculation for SVG display
  const { userX, userY } = useMemo(() => {
    if (!userCoords || !siteCoords || distance === null) {
      return { userX: 150, userY: 150 };
    }
    // Scale so that 1.5 * siteRadius fits within the 120px radius circle
    const maxDisplayDistance = Math.max(siteRadius * 1.8, distance * 1.2, 50);
    const scale = 110 / maxDisplayDistance;

    // Approximate planar delta (lat diff ~ Y inverted, lon diff ~ X)
    const deltaY = (userCoords.lat - siteCoords.lat) * 111320; // meters
    const deltaX =
      (userCoords.lng - siteCoords.lng) *
      111320 *
      Math.cos((siteCoords.lat * Math.PI) / 180); // meters

    const clampX = Math.max(-120, Math.min(120, deltaX * scale));
    const clampY = Math.max(-120, Math.min(120, -deltaY * scale));

    return {
      userX: 150 + clampX,
      userY: 150 + clampY,
    };
  }, [userCoords, siteCoords, distance, siteRadius]);

  const perimeterSvgRadius = useMemo(() => {
    if (!distance) return 70;
    const maxDisplayDistance = Math.max(siteRadius * 1.8, distance * 1.2, 50);
    return (siteRadius / maxDisplayDistance) * 110;
  }, [siteRadius, distance]);

  return (
    <div className="w-full bg-[#0d0e11] rounded-xl border border-white/10 p-4 overflow-hidden relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Geofence Radar ({siteName})
          </span>
        </div>
        {userCoords && (
          <a
            href={`https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="relative flex items-center justify-center py-2">
        <svg
          viewBox="0 0 300 300"
          className="w-full max-w-[280px] h-[260px] drop-shadow-md select-none"
        >
          {/* Background Grid Circles */}
          <circle
            cx="150"
            cy="150"
            r="130"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <circle
            cx="150"
            cy="150"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
          <circle
            cx="150"
            cy="150"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />

          {/* Crosshairs */}
          <line
            x1="20"
            y1="150"
            x2="280"
            y2="150"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <line
            x1="150"
            y1="20"
            x2="150"
            y2="280"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />

          {/* Permitted Geofence Perimeter Ring */}
          <circle
            cx="150"
            cy="150"
            r={perimeterSvgRadius}
            fill="rgba(16,185,129,0.08)"
            stroke="rgba(16,185,129,0.5)"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Site Center (Plant / Site Marker) */}
          <circle cx="150" cy="150" r="5" fill="#10b981" />
          <text
            x="150"
            y="170"
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="10"
            fontWeight="bold"
          >
            {siteName} ({siteRadius}m)
          </text>

          {/* User Location Beacon */}
          {userCoords && (
            <g>
              <circle
                cx={userX}
                cy={userY}
                r="12"
                fill={isInside ? "rgba(59,130,246,0.2)" : "rgba(244,63,94,0.2)"}
                className="animate-ping"
              />
              <circle
                cx={userX}
                cy={userY}
                r="6"
                fill={isInside ? "#3b82f6" : "#f43f5e"}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={userX}
                y={userY - 10}
                textAnchor="middle"
                fill={isInside ? "#93c5fd" : "#fda4af"}
                fontSize="10"
                fontWeight="bold"
              >
                You
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs border-t border-white/5 pt-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400">Status:</span>
          {isInside ? (
            <span className="text-emerald-400 font-semibold">
              Inside Perimeter ({distance !== null ? `${Math.round(distance).toLocaleString()} m (${(distance / 1000).toFixed(2)} km)` : "-"})
            </span>
          ) : (
            <span className="text-rose-400 font-semibold">
              Outside Perimeter ({distance !== null ? `${Math.round(distance).toLocaleString()} m (${(distance / 1000).toFixed(2)} km)` : "-"})
            </span>
          )}
        </div>
        {userCoords && (
          <span className="text-zinc-500 font-mono text-[11px]">
            {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
}

