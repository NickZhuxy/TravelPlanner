import type { Trip } from '../types';

const STORAGE_KEY = 'travel-planner-trip';

export function saveTrip(trip: Trip): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
}

export function loadTrip(): Trip | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as Trip;
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
        resolve(trip);
      } catch {
        reject(new Error('Invalid trip file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
