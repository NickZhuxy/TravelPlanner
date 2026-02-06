import type { Trip, Day, Segment } from '../types';

const STORAGE_KEY = 'travel-planner-trip';

export function migrateTrip(trip: Trip): Trip {
  const days = trip.days.map((day: Day) => {
    // Backfill spotIds from existing segments if missing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let spotIds = (day as any).spotIds as string[] | undefined;
    if (!spotIds || !Array.isArray(spotIds)) {
      const ids: string[] = [];
      for (const seg of day.segments) {
        if (ids.length === 0) ids.push(seg.fromSpotId);
        if (!ids.includes(seg.toSpotId)) ids.push(seg.toSpotId);
      }
      spotIds = ids;
    }

    // Backfill mode on segments
    const segments = day.segments.map((seg: Segment) => {
      if (!seg.mode) {
        return { ...seg, mode: 'drive' as const };
      }
      return seg;
    });

    return { ...day, spotIds, segments };
  });

  return { ...trip, days };
}

export function saveTrip(trip: Trip): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
}

export function loadTrip(): Trip | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    const trip = JSON.parse(data) as Trip;
    return migrateTrip(trip);
  } catch {
    return null;
  }
}

export function exportTrip(trip: Trip): void {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.name || 'trip'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importTrip(file: File): Promise<Trip> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const trip = JSON.parse(reader.result as string) as Trip;
        resolve(migrateTrip(trip));
      } catch {
        reject(new Error('Invalid trip file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
