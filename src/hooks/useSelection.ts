import { create } from 'zustand';

interface SelectionState {
  selectedSpotId: string | null;
  selectedSegmentId: string | null;
  selectedSegmentDayId: string | null;

  selectSpot: (id: string | null) => void;
  selectSegment: (segmentId: string | null, dayId: string | null) => void;
  clearSelection: () => void;
}

export const useSelection = create<SelectionState>((set) => ({
  selectedSpotId: null,
  selectedSegmentId: null,
  selectedSegmentDayId: null,

  selectSpot: (id) =>
    set({ selectedSpotId: id, selectedSegmentId: null, selectedSegmentDayId: null }),

  selectSegment: (segmentId, dayId) =>
    set({ selectedSpotId: null, selectedSegmentId: segmentId, selectedSegmentDayId: dayId }),

  clearSelection: () =>
    set({ selectedSpotId: null, selectedSegmentId: null, selectedSegmentDayId: null }),
}));
