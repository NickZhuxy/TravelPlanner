import { create } from 'zustand';
import type { Trip, Spot, Day, Segment } from '../types';
import { generateId } from '../utils/id';
import { getDayColor } from '../utils/colors';
import { saveTrip, loadTrip } from '../services/storage';

interface TripState {
  trip: Trip;

  // Trip actions
  setTripName: (name: string) => void;
  setTripDescription: (description: string) => void;
  replaceTrip: (trip: Trip) => void;

  // Spot actions
  addSpot: (spot: Omit<Spot, 'id'>) => Spot;
  updateSpot: (id: string, updates: Partial<Omit<Spot, 'id'>>) => void;
  removeSpot: (id: string) => void;

  // Day actions
  addDay: (label?: string) => Day;
  updateDay: (id: string, updates: Partial<Omit<Day, 'id' | 'segments'>>) => void;
  removeDay: (id: string) => void;
  reorderDays: (dayIds: string[]) => void;

  // Segment actions
  addSegment: (dayId: string, segment: Omit<Segment, 'id'>) => Segment;
  updateSegment: (dayId: string, segmentId: string, updates: Partial<Omit<Segment, 'id'>>) => void;
  removeSegment: (dayId: string, segmentId: string) => void;
  moveSegment: (fromDayId: string, toDayId: string, segmentId: string, newIndex: number) => void;
  reorderSegments: (dayId: string, segmentIds: string[]) => void;
}

function createEmptyTrip(): Trip {
  return {
    id: generateId(),
    name: 'My Trip',
    spots: [],
    days: [],
  };
}

export const useTrip = create<TripState>((set, get) => {
  const persist = () => {
    queueMicrotask(() => saveTrip(get().trip));
  };

  return {
    trip: loadTrip() ?? createEmptyTrip(),

    setTripName: (name) => {
      set((s) => ({ trip: { ...s.trip, name } }));
      persist();
    },

    setTripDescription: (description) => {
      set((s) => ({ trip: { ...s.trip, description } }));
      persist();
    },

    replaceTrip: (trip) => {
      set({ trip });
      persist();
    },

    addSpot: (spotData) => {
      const spot: Spot = { id: generateId(), ...spotData };
      set((s) => ({ trip: { ...s.trip, spots: [...s.trip.spots, spot] } }));
      persist();
      return spot;
    },

    updateSpot: (id, updates) => {
      set((s) => ({
        trip: {
          ...s.trip,
          spots: s.trip.spots.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp)),
        },
      }));
      persist();
    },

    removeSpot: (id) => {
      set((s) => ({
        trip: {
          ...s.trip,
          spots: s.trip.spots.filter((sp) => sp.id !== id),
          days: s.trip.days.map((d) => ({
            ...d,
            segments: d.segments.filter((seg) => seg.fromSpotId !== id && seg.toSpotId !== id),
          })),
        },
      }));
      persist();
    },

    addDay: (label) => {
      const days = get().trip.days;
      const day: Day = {
        id: generateId(),
        label: label ?? `Day ${days.length + 1}`,
        color: getDayColor(days.length),
        segments: [],
      };
      set((s) => ({ trip: { ...s.trip, days: [...s.trip.days, day] } }));
      persist();
      return day;
    },

    updateDay: (id, updates) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        },
      }));
      persist();
    },

    removeDay: (id) => {
      set((s) => ({
        trip: { ...s.trip, days: s.trip.days.filter((d) => d.id !== id) },
      }));
      persist();
    },

    reorderDays: (dayIds) => {
      set((s) => {
        const dayMap = new Map(s.trip.days.map((d) => [d.id, d]));
        const reordered = dayIds.map((id) => dayMap.get(id)!).filter(Boolean);
        return { trip: { ...s.trip, days: reordered } };
      });
      persist();
    },

    addSegment: (dayId, segmentData) => {
      const segment: Segment = { id: generateId(), ...segmentData };
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId ? { ...d, segments: [...d.segments, segment] } : d
          ),
        },
      }));
      persist();
      return segment;
    },

    updateSegment: (dayId, segmentId, updates) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  segments: d.segments.map((seg) =>
                    seg.id === segmentId ? { ...seg, ...updates } : seg
                  ),
                }
              : d
          ),
        },
      }));
      persist();
    },

    removeSegment: (dayId, segmentId) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId
              ? { ...d, segments: d.segments.filter((seg) => seg.id !== segmentId) }
              : d
          ),
        },
      }));
      persist();
    },

    moveSegment: (fromDayId, toDayId, segmentId, newIndex) => {
      set((s) => {
        const fromDay = s.trip.days.find((d) => d.id === fromDayId);
        if (!fromDay) return s;
        const segment = fromDay.segments.find((seg) => seg.id === segmentId);
        if (!segment) return s;

        return {
          trip: {
            ...s.trip,
            days: s.trip.days.map((d) => {
              if (d.id === fromDayId) {
                return { ...d, segments: d.segments.filter((seg) => seg.id !== segmentId) };
              }
              if (d.id === toDayId) {
                const segs = [...d.segments];
                segs.splice(newIndex, 0, segment);
                return { ...d, segments: segs };
              }
              return d;
            }),
          },
        };
      });
      persist();
    },

    reorderSegments: (dayId, segmentIds) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) => {
            if (d.id !== dayId) return d;
            const segMap = new Map(d.segments.map((seg) => [seg.id, seg]));
            const reordered = segmentIds.map((id) => segMap.get(id)!).filter(Boolean);
            return { ...d, segments: reordered };
          }),
        },
      }));
      persist();
    },
  };
});
