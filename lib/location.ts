export const WORK_LOCATIONS = ["GHCL", "Kajli"] as const;
export type WorkLocation = (typeof WORK_LOCATIONS)[number];

export const SITE_COORDINATES: Record<
  WorkLocation,
  { lat: number; lng: number }
> = {
  GHCL: { lat: 20.84872, lng: 70.465691 },
  Kajli: { lat: 20.894496, lng: 70.418492 },
};

export const MAX_ALLOWED_DISTANCE_METERS: Record<WorkLocation, number> = {
  GHCL: 100,
  Kajli: 200,
};

export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = p2 - p1;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) *
      Math.cos(p2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

