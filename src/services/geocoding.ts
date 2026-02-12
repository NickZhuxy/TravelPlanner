import type { SearchResult } from '../types';
import { useSettings } from '../hooks/useSettings';
import { searchPlacesGoogle } from './google/geocoding';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

async function searchPlacesNominatim(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '8',
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding request failed');
  }

  const data = await response.json();

  return data.map((item: { lat: string; lon: string; display_name: string; name?: string }) => ({
    name: item.name || item.display_name.split(',')[0],
    coordinates: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
    displayName: item.display_name,
  }));
}

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  const { mapProvider, googleApiKey } = useSettings.getState();

  if (mapProvider === 'google' && googleApiKey) {
    return searchPlacesGoogle(query, googleApiKey);
  }

  return searchPlacesNominatim(query);
}
