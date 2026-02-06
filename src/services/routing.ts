import type { LineString } from 'geojson';
import type { TransportMode } from '../types';

const OSRM_BASE = 'https://router.project-osrm.org';

const OSRM_PROFILE: Record<TransportMode, string> = {
  drive: 'driving',
  walk: 'foot',
};

export interface RouteResult {
  geometry: LineString;
  duration: number; // seconds
  distance: number; // meters
}

export async function fetchRoute(
  from: [number, number],
  to: [number, number],
  mode: TransportMode = 'drive'
): Promise<RouteResult> {
  // OSRM expects [lng, lat] not [lat, lng]
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const profile = OSRM_PROFILE[mode];

  const response = await fetch(
    `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=geojson`
  );

  if (!response.ok) {
    throw new Error('Routing request failed');
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  return {
    geometry: route.geometry as LineString,
    duration: route.duration as number,
    distance: route.distance as number,
  };
}
