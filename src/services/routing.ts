import type { LineString } from 'geojson';

const OSRM_BASE = 'https://router.project-osrm.org';

export async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<LineString> {
  // OSRM expects [lng, lat] not [lat, lng]
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;

  const response = await fetch(
    `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`
  );

  if (!response.ok) {
    throw new Error('Routing request failed');
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return data.routes[0].geometry as LineString;
}
