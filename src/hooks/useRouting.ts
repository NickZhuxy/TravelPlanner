import { useState } from 'react';
import { fetchRoute } from '../services/routing';
import { useTrip } from './useTrip';

export function useRouting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addSegment = useTrip((s) => s.addSegment);

  const createSegment = async (
    dayId: string,
    fromSpotId: string,
    toSpotId: string,
    fromCoords: [number, number],
    toCoords: [number, number]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const geometry = await fetchRoute(fromCoords, toCoords);
      const segment = addSegment(dayId, {
        fromSpotId,
        toSpotId,
        routeGeometry: geometry,
      });
      return segment;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch route';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createSegment, loading, error };
}
