import { create } from 'zustand';
import { clearTileSession } from '../services/google/tiles';
import { useTrip } from './useTrip';

export type MapProvider = 'free' | 'google';

interface SettingsState {
  mapProvider: MapProvider;
  googleApiKey: string;

  setMapProvider: (provider: MapProvider) => void;
  setGoogleApiKey: (key: string) => void;
}

const SETTINGS_KEY = 'travel-planner-settings';

function loadSettings(): { mapProvider: MapProvider; googleApiKey: string } {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        mapProvider: parsed.mapProvider === 'google' ? 'google' : 'free',
        googleApiKey: parsed.googleApiKey || '',
      };
    }
  } catch { /* ignore */ }
  return { mapProvider: 'free', googleApiKey: '' };
}

function persistSettings(state: { mapProvider: MapProvider; googleApiKey: string }) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mapProvider: state.mapProvider,
      googleApiKey: state.googleApiKey,
    }));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

function invalidateRoutes() {
  const tripState = useTrip.getState();
  const updatedDays = tripState.trip.days.map((day) => ({
    ...day,
    segments: day.segments.map((seg) => ({
      ...seg,
      routeGeometry: null,
      duration: undefined,
      distance: undefined,
    })),
  }));
  tripState.replaceTrip({ ...tripState.trip, days: updatedDays });
}

export const useSettings = create<SettingsState>((set, get) => {
  const initial = loadSettings();
  const persist = () => queueMicrotask(() => persistSettings(get()));

  return {
    ...initial,

    setMapProvider: (provider) => {
      set({ mapProvider: provider });
      persist();
      clearTileSession();
      invalidateRoutes();
    },

    setGoogleApiKey: (key) => {
      set({ googleApiKey: key });
      persist();
      clearTileSession();
      if (get().mapProvider === 'google') {
        invalidateRoutes();
      }
    },
  };
});
