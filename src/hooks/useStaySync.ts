import { useEffect, useRef } from 'react';
import { useTrip } from './useTrip';

function stayFingerprint(
  days: { id: string; spotIds: string[]; staySpotId?: string }[],
): string {
  return days
    .map((d) => `${d.id}|${d.spotIds.join(',')}|${d.staySpotId ?? ''}`)
    .join('||');
}

export function useStaySync() {
  const { trip, syncStayStarts } = useTrip();
  const prevRef = useRef('');

  useEffect(() => {
    const fp = stayFingerprint(trip.days);
    if (fp === prevRef.current) return;
    prevRef.current = fp;
    syncStayStarts();
  });
}
