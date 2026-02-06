import { createContext, useContext } from 'react';
import type { MapProviderInterface } from './MapProvider';
import { searchPlaces } from '../services/geocoding';

const defaultProvider: MapProviderInterface = {
  geocode: searchPlaces,
};

const MapContext = createContext<MapProviderInterface>(defaultProvider);

export const MapProviderContext = MapContext;

export function useMapProvider(): MapProviderInterface {
  return useContext(MapContext);
}
