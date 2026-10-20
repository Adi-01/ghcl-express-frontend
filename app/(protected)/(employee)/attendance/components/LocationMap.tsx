"use client";

import { useMemo, useState, useEffect } from "react";
import { Map, Overlay, GeoJson } from "pigeon-maps";
import {
  Navigation,
  MapPin,
  ExternalLink,
  Layers,
  Crosshair,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { WorkLocation, getDistanceInMeters } from "@/lib/location";
import { cn } from "@/lib/utils";

export function formatDistance(meters: number): string {
  const m = Math.round(meters);
  const km = (meters / 1000).toFixed(2);
  return `${m.toLocaleString()} m (${km} km)`;
}

// Generate GeoJSON Polygon for circular geofence boundary
function createGeoJsonCircle(
  lat: number,
  lng: number,
  radiusMeters: number,
  points = 64
) {
  const coords: [number, number][] = [];
  const km = radiusMeters / 1000;
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [coords],
        },
        properties: {},
      },
    ],
  };
}

// Esri Satellite tile provider (exact matching satellite look from legacy)
const esriSatellite = (x: number, y: number, z: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

// Dark tile provider matching dark design system
const cartoDark = (x: number, y: number, z: number) =>
  `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;

interface LocationMapProps {
  userCoords: { lat: number; lng: number } | null;
  siteCoords: { lat: number; lng: number } | null;
  siteRadius: number;
  siteName: WorkLocation | string;
  isLocating?: boolean;
  locationError?: string | null;
  onRetry?: () => void;
}

export function LocationMap({
  userCoords,
  siteCoords,
  siteRadius,
  siteName,
  isLocating = false,
  locationError = null,
  onRetry,
}: LocationMapProps) {
  const [mapType, setMapType] = useState<"satellite" | "dark">("satellite");

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

  // Initial center prioritizes site, falls back to user coords
  const initialCenter: [number, number] = useMemo(() => {
    if (userCoords && siteCoords) {
      return [(userCoords.lat + siteCoords.lat) / 2, (userCoords.lng + siteCoords.lng) / 2];
    }
    if (siteCoords) return [siteCoords.lat, siteCoords.lng];
    if (userCoords) return [userCoords.lat, userCoords.lng];
    return [20.84, 70.43];
  }, [userCoords, siteCoords]);

  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [zoom, setZoom] = useState(15);

  // Update center when site changes
  useEffect(() => {
    if (siteCoords) {
      if (userCoords) {
        setCenter([(userCoords.lat + siteCoords.lat) / 2, (userCoords.lng + siteCoords.lng) / 2]);
      } else {
        setCenter([siteCoords.lat, siteCoords.lng]);
      }
    }
  }, [siteCoords?.lat, siteCoords?.lng]);

  const circleGeoJson = useMemo(() => {
    if (!siteCoords) return null;
    return createGeoJsonCircle(siteCoords.lat, siteCoords.lng, siteRadius);
  }, [siteCoords, siteRadius]);

  const recenter = () => {
    if (userCoords) {
      setCenter([userCoords.lat, userCoords.lng]);
      setZoom(16);
    } else if (siteCoords) {
      setCenter([siteCoords.lat, siteCoords.lng]);
      setZoom(15);
    }
  };

  return (
    <div className="w-full bg-[#0d0e11] rounded-xl border border-white/10 p-3 overflow-hidden relative space-y-2">
      {/* Header controls */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-zinc-300 text-[11px]">
            Geofence Map ({siteName})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapType((m) => (m === "satellite" ? "dark" : "satellite"))}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-white/10 transition-colors"
            title="Toggle Map Style"
          >
            <Layers className="w-3 h-3" />
            <span className="capitalize">{mapType}</span>
          </button>

          {(!userCoords || locationError) && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isLocating}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[11px] border border-blue-500/30 transition-colors disabled:opacity-50"
              title="Retry acquiring GPS location"
            >
              <RefreshCw className={cn("w-3 h-3", isLocating && "animate-spin")} />
              <span>Retry GPS</span>
            </button>
          )}

          {userCoords && (
            <button
              type="button"
              onClick={recenter}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-white/10 transition-colors"
              title="Center on my location"
            >
              <Crosshair className="w-3 h-3 text-blue-400" />
              <span>Me</span>
            </button>
          )}

          {userCoords && (
            <a
              href={`https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Interactive Pigeon Map Container */}
      <div className="h-60 w-full rounded-lg overflow-hidden border border-white/10 relative shadow-inner">
        <Map
          height={240}
          center={center}
          zoom={zoom}
          onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
            setCenter(newCenter);
            setZoom(newZoom);
          }}
          provider={mapType === "satellite" ? esriSatellite : cartoDark}
          attribution={false}
          metaWheelZoom={false}
        >
          {/* Circular Geofence Boundary */}
          {circleGeoJson && (
            <GeoJson
              data={circleGeoJson}
              svgAttributes={{
                fill: isInside ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.15)",
                stroke: isInside ? "#22c55e" : "#ef4444",
                strokeWidth: "2",
                strokeDasharray: "4 2",
              }}
            />
          )}

          {/* Plant / Site Center Marker */}
          {siteCoords && (
            <Overlay anchor={[siteCoords.lat, siteCoords.lng]} offset={[12, 30]}>
              <div className="flex flex-col items-center pointer-events-none select-none">
                <div className="px-1.5 py-0.5 rounded bg-black/85 backdrop-blur border border-white/20 text-[9px] font-bold text-emerald-400 whitespace-nowrap shadow-md mb-1">
                  {siteName} ({siteRadius}m)
                </div>
                <div className="w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>
            </Overlay>
          )}

          {/* Live User Location Marker */}
          {userCoords && (
            <Overlay anchor={[userCoords.lat, userCoords.lng]} offset={[12, 30]}>
              <div className="flex flex-col items-center pointer-events-none select-none">
                <div
                  className={cn(
                    "px-1.5 py-0.5 rounded backdrop-blur border text-[9px] font-bold whitespace-nowrap shadow-md mb-1",
                    isInside
                      ? "bg-emerald-950/85 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/85 border-rose-500/40 text-rose-300"
                  )}
                >
                  You ({isInside ? "Inside" : "Outside"})
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_12px_rgba(59,130,246,0.9)] animate-pulse" />
                  <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
                </div>
              </div>
            </Overlay>
          )}
        </Map>
      </div>

      {/* Status Bar */}
      <div className="mt-2 flex items-center justify-between text-xs border-t border-white/5 pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400">Status:</span>
          {distance !== null ? (
            isInside ? (
              <span className="text-emerald-400 font-semibold">
                Inside Perimeter • {formatDistance(distance)}
              </span>
            ) : (
              <span className="text-rose-400 font-semibold">
                Outside Perimeter • {formatDistance(distance)}
              </span>
            )
          ) : locationError ? (
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {locationError}
            </span>
          ) : isLocating ? (
            <span className="text-blue-400 font-medium flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              Acquiring GPS location...
            </span>
          ) : (
            <span className="text-zinc-500">Location not acquired.</span>
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
