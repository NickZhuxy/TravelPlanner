import type { LineString } from 'geojson';

export type TransportMode = 'walk' | 'drive';

export interface Spot {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  link?: string;
  notes?: string;
}

export interface Segment {
  id: string;
  fromSpotId: string;
  toSpotId: string;
  routeGeometry: LineString | null; // null if route not yet fetched
  mode: TransportMode;
  duration?: number; // seconds
  distance?: number; // meters
  link?: string;
  notes?: string;
  color?: string;   // overrides day color if set
  width?: number;   // overrides default width if set
}

export interface Day {
  id: string;
  label: string;
  color: string;
  spotIds: string[]; // ordered spot IDs — source of truth for itinerary
  segments: Segment[];
  staySpotId?: string; // spot where the user stays overnight
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  spots: Spot[];
  days: Day[];
}

export interface SearchResult {
  name: string;
  coordinates: [number, number];
  displayName: string;
}
