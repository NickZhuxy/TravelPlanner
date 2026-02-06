import { create } from 'zustand';

interface SegmentCreationState {
  firstSpotId: string | null;
  secondSpotId: string | null;
  isPickingDay: boolean;

  startCreation: (spotId: string) => void;
  setSecondSpot: (spotId: string) => void;
  showDayPicker: () => void;
  cancel: () => void;
  reset: () => void;
}

export const useSegmentCreation = create<SegmentCreationState>((set) => ({
  firstSpotId: null,
  secondSpotId: null,
  isPickingDay: false,

  startCreation: (spotId) => set({ firstSpotId: spotId, secondSpotId: null, isPickingDay: false }),

  setSecondSpot: (spotId) => set((s) => {
    if (s.firstSpotId && spotId !== s.firstSpotId) {
      return { secondSpotId: spotId, isPickingDay: true };
    }
    return s;
  }),

  showDayPicker: () => set({ isPickingDay: true }),

  cancel: () => set({ firstSpotId: null, secondSpotId: null, isPickingDay: false }),

  reset: () => set({ firstSpotId: null, secondSpotId: null, isPickingDay: false }),
}));
