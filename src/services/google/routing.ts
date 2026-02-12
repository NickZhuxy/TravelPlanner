import type { LineString } from 'geojson';
import type { TransportMode } from '../../types';
import type { RouteResult } from '../routing';

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

const GOOGLE_TRAVEL_MODE: Record<TransportMode, string> = {
  drive: 'DRIVE',
  walk: 'WALK',
};

export async function fetchRouteGoogle(
  from: [number, number],
  to: [number, number],
  mode: TransportMode,
  apiKey: string,
): Promise<RouteResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline',
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: from[0], longitude: from[1] },
          },
        },
        destination: {
          location: {
            latLng: { latitude: to[0], longitude: to[1] },
          },
        },
        travelMode: GOOGLE_TRAVEL_MODE[mode],
        polylineEncoding: 'GEO_JSON_LINESTRING',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Google routing request failed');
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    // Duration comes as "300s" string, parse to seconds number
    const durationStr: string = route.duration ?? '0s';
    const duration = parseInt(durationStr.replace('s', ''), 10);

    return {
      geometry: route.polyline.geoJsonLinestring as LineString,
      duration,
      distance: route.distanceMeters as number,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
