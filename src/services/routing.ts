import type { LineString } from 'geojson';
import type { TransportMode } from '../types';
import { useSettings } from '../hooks/useSettings';
import { fetchRouteGoogle } from './google/routing';

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

async function fetchRouteOSRM(
  from: [number, number],
  to: [number, number],
  mode: TransportMode,
): Promise<RouteResult> {
  // OSRM expects [lng, lat] not [lat, lng]
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const profile = OSRM_PROFILE[mode];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=geojson`,
      { signal: controller.signal }
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
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRoute(
  from: [number, number],
  to: [number, number],
  mode: TransportMode = 'drive',
): Promise<RouteResult> {
  const { mapProvider, googleApiKey } = useSettings.getState();

  if (mapProvider === 'google' && googleApiKey) {
    return fetchRouteGoogle(from, to, mode, googleApiKey);
  }

  return fetchRouteOSRM(from, to, mode);
}
