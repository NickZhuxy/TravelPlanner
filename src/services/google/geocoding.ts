import type { SearchResult } from '../../types';

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

interface GooglePlace {
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
}

export async function searchPlacesGoogle(
  query: string,
  apiKey: string,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const response = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!response.ok) {
    throw new Error('Google geocoding request failed');
  }

  const data = await response.json();
  const places: GooglePlace[] = data.places ?? [];

  return places.map((place) => ({
    name: place.displayName.text,
    coordinates: [place.location.latitude, place.location.longitude] as [number, number],
    displayName: place.formattedAddress,
  }));
}
