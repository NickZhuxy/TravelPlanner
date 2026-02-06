import { useEffect, useRef } from 'react';
import { useTrip } from './useTrip';
import { fetchRoute } from '../services/routing';
import { generateId } from '../utils/id';
import type { Segment, TransportMode } from '../types';

function dayFingerprint(day: { id: string; spotIds: string[]; segments: { fromSpotId: string; toSpotId: string; mode: TransportMode; routeGeometry: unknown }[] }): string {
  const segParts = day.segments.map(
    (s) => `${s.fromSpotId}:${s.toSpotId}:${s.mode}:${s.routeGeometry === null ? 'null' : 'ok'}`
  );
  return `${day.id}|${day.spotIds.join(',')}|${segParts.join(';')}`;
}

export function useDayRoutes() {
  const { trip, setDaySegments } = useTrip();
  const pendingRef = useRef<Set<string>>(new Set());
  const prevFingerprintRef = useRef<string>('');

  useEffect(() => {
    const fingerprint = trip.days.map(dayFingerprint).join('||');
    if (fingerprint === prevFingerprintRef.current) return;
    prevFingerprintRef.current = fingerprint;

    for (const day of trip.days) {
      const { spotIds, segments } = day;

      // Build lookup of existing segments by "fromId:toId"
      const existingMap = new Map<string, Segment>();
      for (const seg of segments) {
        existingMap.set(`${seg.fromSpotId}:${seg.toSpotId}`, seg);
      }

      // Derive needed pairs from consecutive spotIds
      const neededPairs: [string, string][] = [];
      for (let i = 0; i < spotIds.length - 1; i++) {
        neededPairs.push([spotIds[i], spotIds[i + 1]]);
      }

      // Build new segment list, reusing existing where possible
      const newSegments: Segment[] = neededPairs.map(([fromId, toId]) => {
        const key = `${fromId}:${toId}`;
        const existing = existingMap.get(key);
        if (existing) return existing;

        // Create placeholder segment
        return {
          id: generateId(),
          fromSpotId: fromId,
          toSpotId: toId,
          routeGeometry: null,
          mode: 'drive' as TransportMode,
        };
      });

      // Check if segments changed
      const oldIds = segments.map((s) => s.id).join(',');
      const newIds = newSegments.map((s) => s.id).join(',');
      if (oldIds !== newIds) {
        setDaySegments(day.id, newSegments);
      }

      // Fetch routes for segments missing geometry
      const spotMap = new Map(trip.spots.map((s) => [s.id, s]));

      for (const seg of newSegments) {
        if (seg.routeGeometry !== null) continue;

        const pendingKey = `${day.id}:${seg.fromSpotId}:${seg.toSpotId}:${seg.mode}`;
        if (pendingRef.current.has(pendingKey)) continue;
        pendingRef.current.add(pendingKey);

        const fromSpot = spotMap.get(seg.fromSpotId);
        const toSpot = spotMap.get(seg.toSpotId);

        if (!fromSpot || !toSpot) {
          pendingRef.current.delete(pendingKey);
          continue;
        }

        fetchRoute(fromSpot.coordinates, toSpot.coordinates, seg.mode)
          .then((result) => {
            // Read latest state to find the segment
            const currentTrip = useTrip.getState().trip;
            const currentDay = currentTrip.days.find((d) => d.id === day.id);
            const currentSeg = currentDay?.segments.find(
              (s) => s.fromSpotId === seg.fromSpotId && s.toSpotId === seg.toSpotId && s.mode === seg.mode
            );
            if (currentSeg) {
              useTrip.getState().updateSegment(day.id, currentSeg.id, {
                routeGeometry: result.geometry,
                duration: result.duration,
                distance: result.distance,
              });
            }
          })
          .catch(() => {
            // Route fetch failed — segment stays with null geometry
          })
          .finally(() => {
            pendingRef.current.delete(pendingKey);
          });
      }
    }
  });
}
