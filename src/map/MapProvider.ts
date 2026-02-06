import type { SearchResult, Spot } from '../types';

export interface MarkerOptions {
  spot: Spot;
  isSelected?: boolean;
  isTemporary?: boolean;
  onClick?: (spot: Spot) => void;
}

export interface PolylineOptions {
  positions: [number, number][];
  color: string;
  width: number;
  segmentId: string;
  isSelected?: boolean;
  onClick?: (segmentId: string) => void;
}

export interface MapProviderInterface {
  geocode: (query: string) => Promise<SearchResult[]>;
}
