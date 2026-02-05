import type { LineString } from 'geojson';

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
  link?: string;
  notes?: string;
  color?: string;   // overrides day color if set
  width?: number;   // overrides default width if set
}

export interface Day {
  id: string;
  label: string;
  color: string;
  segments: Segment[];
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
