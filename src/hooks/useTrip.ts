import { create } from 'zustand';
import type { Trip, Spot, Day, Segment } from '../types';
import { generateId } from '../utils/id';
import { getDayColor } from '../utils/colors';
import { saveTrip, loadTrip } from '../services/storage';
import { useSelection } from './useSelection';

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
  updateDay: (id: string, updates: Partial<Omit<Day, 'id' | 'segments' | 'spotIds'>>) => void;
  removeDay: (id: string) => void;
  reorderDays: (dayIds: string[]) => void;

  // Spot-in-day actions
  addSpotToDay: (dayId: string, spotId: string) => void;
  removeSpotFromDay: (dayId: string, spotId: string) => void;
  reorderDaySpots: (dayId: string, spotIds: string[]) => void;

  // Segment actions (auto-managed by useDayRoutes)
  setDaySegments: (dayId: string, segments: Segment[]) => void;
  updateSegment: (dayId: string, segmentId: string, updates: Partial<Omit<Segment, 'id'>>) => void;

  // Cross-container DnD
  moveSpotToDay: (
    spotId: string,
    fromDayId: string | null,
    toDayId: string | null,
    insertIndex: number,
  ) => void;
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
            spotIds: d.spotIds.filter((sid) => sid !== id),
            segments: d.segments.filter((seg) => seg.fromSpotId !== id && seg.toSpotId !== id),
            staySpotId: d.staySpotId === id ? undefined : d.staySpotId,
          })),
        },
      }));
      const sel = useSelection.getState();
      if (sel.selectedSpotId === id) sel.clearSelection();
      persist();
    },

    addDay: (label) => {
      const days = get().trip.days;
      const lastDay = days[days.length - 1];
      const inheritedSpotId = lastDay?.spotIds[lastDay.spotIds.length - 1];
      const day: Day = {
        id: generateId(),
        label: label ?? `Day ${days.length + 1}`,
        color: getDayColor(days.length),
        spotIds: inheritedSpotId ? [inheritedSpotId] : [],
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
      set((s) => {
        const remaining = s.trip.days.filter((d) => d.id !== id);
        // Renumber days that follow the "Day N" pattern
        let dayNum = 1;
        const relabeled = remaining.map((d) => {
          if (/^Day \d+$/.test(d.label)) {
            return { ...d, label: `Day ${dayNum++}` };
          }
          dayNum++;
          return d;
        });
        return { trip: { ...s.trip, days: relabeled } };
      });
      const sel = useSelection.getState();
      if (sel.selectedSegmentDayId === id) sel.clearSelection();
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

    addSpotToDay: (dayId, spotId) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId && !d.spotIds.includes(spotId)
              ? { ...d, spotIds: [...d.spotIds, spotId] }
              : d
          ),
        },
      }));
      persist();
    },

    removeSpotFromDay: (dayId, spotId) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  spotIds: d.spotIds.filter((sid) => sid !== spotId),
                  segments: d.segments.filter(
                    (seg) => seg.fromSpotId !== spotId && seg.toSpotId !== spotId
                  ),
                  staySpotId: d.staySpotId === spotId ? undefined : d.staySpotId,
                }
              : d
          ),
        },
      }));
      persist();
    },

    reorderDaySpots: (dayId, spotIds) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId ? { ...d, spotIds } : d
          ),
        },
      }));
      persist();
    },

    setDaySegments: (dayId, segments) => {
      set((s) => ({
        trip: {
          ...s.trip,
          days: s.trip.days.map((d) =>
            d.id === dayId ? { ...d, segments } : d
          ),
        },
      }));
      persist();
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

    moveSpotToDay: (spotId, fromDayId, toDayId, insertIndex) => {
      set((s) => {
        let days = s.trip.days;

        // Remove from source day
        if (fromDayId) {
          days = days.map((d) =>
            d.id === fromDayId
              ? {
                  ...d,
                  spotIds: d.spotIds.filter((sid) => sid !== spotId),
                  segments: d.segments.filter(
                    (seg) => seg.fromSpotId !== spotId && seg.toSpotId !== spotId
                  ),
                  staySpotId: d.staySpotId === spotId ? undefined : d.staySpotId,
                }
              : d
          );
        }

        // Insert into target day
        if (toDayId) {
          days = days.map((d) => {
            if (d.id !== toDayId) return d;
            if (d.spotIds.includes(spotId)) return d;
            const newSpotIds = [...d.spotIds];
            newSpotIds.splice(Math.min(insertIndex, newSpotIds.length), 0, spotId);
            return { ...d, spotIds: newSpotIds };
          });
        }

        return { trip: { ...s.trip, days } };
      });
      persist();
    },

  };
});
