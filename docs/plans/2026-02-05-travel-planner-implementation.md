# Travel Planner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a road trip planning web app with interactive map, day-based route segments, spot search, and route visualization.

**Architecture:** React + TypeScript SPA with Zustand for state, react-leaflet for maps, Nominatim for geocoding, OSRM for driving directions. Map layer abstracted behind a provider interface for future swappability. All data persisted to localStorage with JSON export/import.

**Tech Stack:** React 18, TypeScript, Vite, react-leaflet, Leaflet, Zustand, dnd-kit, CSS Modules

**Design doc:** `docs/plans/2026-02-05-travel-planner-design.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.module.css`

**Step 1: Initialize Vite React+TS project**

Run:
```bash
cd /Users/nickzhu/Desktop/Projects/TravelPlanner
npm create vite@latest . -- --template react-ts
```

If prompted about non-empty directory, proceed (only docs/ exists).

**Step 2: Install core dependencies**

Run:
```bash
npm install leaflet react-leaflet zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D @types/leaflet
```

**Step 3: Verify it runs**

Run:
```bash
npm run dev
```

Expected: Vite dev server starts, app loads at localhost:5173.

**Step 4: Clean up boilerplate**

Remove default Vite content from `src/App.tsx`. Replace with a minimal shell:

```tsx
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <h1>Travel Planner</h1>
    </div>
  );
}

export default App;
```

Create `src/App.module.css`:
```css
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

Remove `src/App.css` and `src/index.css` boilerplate styling. Update `src/main.tsx` to not import `index.css` if removed, or keep a minimal reset in it.

**Step 5: Verify clean app loads**

Run: `npm run dev`
Expected: Page shows "Travel Planner" with no Vite boilerplate.

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite React+TS project with dependencies"
```

---

### Task 2: Types & Utilities

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/id.ts`
- Create: `src/utils/colors.ts`

**Step 1: Define core types**

Create `src/types/index.ts`:

```ts
export interface Spot {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  link?: string;
  notes?: string;
}

export interface Segment {
  id: string;
  fromSpotId: string;
  toSpotId: string;
  routeGeometry: GeoJSON.LineString | null; // null if route not yet fetched
  link?: string;
  notes?: string;
  color?: string;   // overrides day color if set
  width?: number;   // overrides default width if set
}

export interface Day {
  id: string;
  label: string;
  color: string;
  segments: Segment[];
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  spots: Spot[];
  days: Day[];
}

export interface SearchResult {
  name: string;
  coordinates: [number, number];
  displayName: string;
}
```

**Step 2: Create ID utility**

Create `src/utils/id.ts`:

```ts
export function generateId(): string {
  return crypto.randomUUID();
}
```

**Step 3: Create color palette utility**

Create `src/utils/colors.ts`:

```ts
const DAY_COLORS = [
  '#4285F4', // blue
  '#EA4335', // red
  '#34A853', // green
  '#FBBC05', // yellow
  '#8E24AA', // purple
  '#00ACC1', // cyan
  '#FF7043', // deep orange
  '#5C6BC0', // indigo
  '#26A69A', // teal
  '#EC407A', // pink
];

export const DEFAULT_SEGMENT_WIDTH = 4;

export function getDayColor(index: number): string {
  return DAY_COLORS[index % DAY_COLORS.length];
}

export function getSegmentColor(segment: { color?: string }, day: { color: string }): string {
  return segment.color ?? day.color;
}

export function getSegmentWidth(segment: { width?: number }): number {
  return segment.width ?? DEFAULT_SEGMENT_WIDTH;
}
```

**Step 4: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds with no type errors.

**Step 5: Commit**

```bash
git add src/types src/utils
git commit -m "feat: add core types and utility functions"
```

---

### Task 3: Trip State Store (Zustand)

**Files:**
- Create: `src/hooks/useTrip.ts`
- Create: `src/services/storage.ts`

**Step 1: Create storage service**

Create `src/services/storage.ts`:

```ts
import { Trip } from '../types';

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
```

**Step 2: Create Zustand trip store**

Create `src/hooks/useTrip.ts`:

```ts
import { create } from 'zustand';
import { Trip, Spot, Day, Segment } from '../types';
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
    // defer to next microtask so state is updated
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
          // Also remove any segments referencing this spot
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
```

**Step 3: Verify build compiles**

Run: `npm run build`
Expected: No type errors.

**Step 4: Commit**

```bash
git add src/hooks/useTrip.ts src/services/storage.ts
git commit -m "feat: add Zustand trip store with localStorage persistence"
```

---

### Task 4: External API Services (Geocoding + Routing)

**Files:**
- Create: `src/services/geocoding.ts`
- Create: `src/services/routing.ts`
- Create: `src/hooks/useRouting.ts`

**Step 1: Create Nominatim geocoding service**

Create `src/services/geocoding.ts`:

```ts
import { SearchResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '8',
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding request failed');
  }

  const data = await response.json();

  return data.map((item: { lat: string; lon: string; display_name: string; name?: string }) => ({
    name: item.name || item.display_name.split(',')[0],
    coordinates: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
    displayName: item.display_name,
  }));
}
```

**Step 2: Create OSRM routing service**

Create `src/services/routing.ts`:

```ts
const OSRM_BASE = 'https://router.project-osrm.org';

export async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<GeoJSON.LineString> {
  // OSRM expects [lng, lat] not [lat, lng]
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;

  const response = await fetch(
    `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`
  );

  if (!response.ok) {
    throw new Error('Routing request failed');
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return data.routes[0].geometry as GeoJSON.LineString;
}
```

**Step 3: Create useRouting hook**

Create `src/hooks/useRouting.ts`:

```ts
import { useState } from 'react';
import { fetchRoute } from '../services/routing';
import { useTrip } from './useTrip';

export function useRouting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSegment } = useTrip();

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
```

**Step 4: Verify build compiles**

Run: `npm run build`
Expected: No type errors. (Note: you may need to install `@types/geojson` if GeoJSON types aren't resolved — run `npm install -D @types/geojson` if needed.)

**Step 5: Commit**

```bash
git add src/services/geocoding.ts src/services/routing.ts src/hooks/useRouting.ts
git commit -m "feat: add Nominatim geocoding and OSRM routing services"
```

---

### Task 5: Map Provider Abstraction + Leaflet Implementation

**Files:**
- Create: `src/map/MapProvider.ts`
- Create: `src/map/LeafletMap.tsx`
- Create: `src/map/LeafletMap.module.css`
- Create: `src/map/MapContext.tsx`

**Step 1: Define map provider interface**

Create `src/map/MapProvider.ts`:

```ts
import { SearchResult, Spot } from '../types';

export interface MarkerOptions {
  spot: Spot;
  isSelected?: boolean;
  isTemporary?: boolean;
  onClick?: (spot: Spot) => void;
}

export interface PolylineOptions {
  positions: [number, number][];
  color: string;
  width: number;
  segmentId: string;
  isSelected?: boolean;
  onClick?: (segmentId: string) => void;
}

export interface MapProviderInterface {
  geocode: (query: string) => Promise<SearchResult[]>;
}
```

This is a minimal abstraction — the actual rendering is done via React components. To swap providers later, you'd create a new component set (e.g., `MapLibreMap.tsx`) following the same props contract. The `geocode` function is the main swappable service.

**Step 2: Create MapContext**

Create `src/map/MapContext.tsx`:

```ts
import { createContext, useContext } from 'react';
import { MapProviderInterface } from './MapProvider';
import { searchPlaces } from '../services/geocoding';

const defaultProvider: MapProviderInterface = {
  geocode: searchPlaces,
};

const MapContext = createContext<MapProviderInterface>(defaultProvider);

export const MapProviderContext = MapContext;

export function useMapProvider(): MapProviderInterface {
  return useContext(MapContext);
}
```

**Step 3: Create LeafletMap component**

Create `src/map/LeafletMap.tsx`:

```tsx
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './LeafletMap.module.css';
import { Spot } from '../types';

// Fix default marker icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface MapMarker {
  spot: Spot;
  isSelected?: boolean;
  isTemporary?: boolean;
}

interface MapRoute {
  segmentId: string;
  positions: [number, number][];
  color: string;
  width: number;
  isSelected?: boolean;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers: MapMarker[];
  routes: MapRoute[];
  onMarkerClick?: (spot: Spot) => void;
  onRouteClick?: (segmentId: string) => void;
  onMapClick?: (latlng: [number, number]) => void;
  children?: React.ReactNode;
}

function MapClickHandler({ onClick }: { onClick?: (latlng: [number, number]) => void }) {
  useMapEvents({
    click: (e) => {
      onClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const temporaryIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: styles.temporaryMarker,
});

const selectedIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  className: styles.selectedMarker,
});

export default function LeafletMap({
  center = [39.8283, -98.5795], // center of US
  zoom = 4,
  markers,
  routes,
  onMarkerClick,
  onRouteClick,
  onMapClick,
  children,
}: LeafletMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={styles.map}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onMapClick} />

      {markers.map((m) => (
        <Marker
          key={m.spot.id}
          position={m.spot.coordinates}
          icon={m.isTemporary ? temporaryIcon : m.isSelected ? selectedIcon : undefined}
          eventHandlers={{
            click: () => onMarkerClick?.(m.spot),
          }}
        >
          <Popup>{m.spot.name}</Popup>
        </Marker>
      ))}

      {routes.map((r) => (
        <Polyline
          key={r.segmentId}
          positions={r.positions}
          pathOptions={{
            color: r.color,
            weight: r.isSelected ? r.width + 2 : r.width,
            opacity: r.isSelected ? 1 : 0.7,
          }}
          eventHandlers={{
            click: () => onRouteClick?.(r.segmentId),
          }}
        />
      ))}

      {children}
    </MapContainer>
  );
}
```

**Step 4: Create LeafletMap styles**

Create `src/map/LeafletMap.module.css`:

```css
.map {
  width: 100%;
  height: 100%;
  z-index: 0;
}

.temporaryMarker {
  filter: hue-rotate(180deg) opacity(0.7);
  animation: pulse 1.5s infinite;
}

.selectedMarker {
  filter: hue-rotate(90deg) brightness(1.2);
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

**Step 5: Verify build compiles**

Run: `npm run build`
Expected: No errors. If leaflet image imports fail, may need to add `*.png` type declaration — create `src/vite-env.d.ts` or update existing one if needed.

**Step 6: Commit**

```bash
git add src/map
git commit -m "feat: add map provider abstraction and Leaflet implementation"
```

---

### Task 6: App Layout Shell (Toolbar + SidePanel + Map + DetailBar)

**Files:**
- Create: `src/components/Toolbar.tsx`, `src/components/Toolbar.module.css`
- Create: `src/components/SidePanel/SidePanel.tsx`, `src/components/SidePanel/SidePanel.module.css`
- Create: `src/components/DetailBar/DetailBar.tsx`, `src/components/DetailBar/DetailBar.module.css`
- Modify: `src/App.tsx`, `src/App.module.css`
- Create: `src/hooks/useSelection.ts`

**Step 1: Create selection state hook**

Create `src/hooks/useSelection.ts`:

```ts
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
```

**Step 2: Create Toolbar**

Create `src/components/Toolbar.tsx`:

```tsx
import { useRef } from 'react';
import { useTrip } from '../hooks/useTrip';
import { exportTrip, importTrip } from '../services/storage';
import styles from './Toolbar.module.css';

export default function Toolbar() {
  const { trip, setTripName, replaceTrip } = useTrip();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportTrip(trip);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('This will replace your current trip. Continue?')) return;
    try {
      const imported = await importTrip(file);
      replaceTrip(imported);
    } catch {
      alert('Failed to import trip file.');
    }
    e.target.value = '';
  };

  return (
    <div className={styles.toolbar}>
      <input
        className={styles.tripName}
        value={trip.name}
        onChange={(e) => setTripName(e.target.value)}
      />
      <div className={styles.actions}>
        <button onClick={handleExport}>Export</button>
        <button onClick={() => fileInputRef.current?.click()}>Import</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
```

Create `src/components/Toolbar.module.css`:

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #1a1a2e;
  color: #fff;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.tripName {
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.tripName:hover,
.tripName:focus {
  border-color: #555;
  outline: none;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 6px 14px;
  background: #2d2d44;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.actions button:hover {
  background: #3d3d5c;
}
```

**Step 3: Create SidePanel placeholder**

Create `src/components/SidePanel/SidePanel.tsx`:

```tsx
import { useTrip } from '../../hooks/useTrip';
import styles from './SidePanel.module.css';

export default function SidePanel() {
  const { trip, addDay } = useTrip();

  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        {trip.days.map((day) => (
          <div key={day.id} className={styles.dayPlaceholder}>
            <span style={{ color: day.color }}>{day.label}</span>
            <span className={styles.segCount}>{day.segments.length} segments</span>
          </div>
        ))}

        {trip.spots.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>Unassigned Spots</div>
            {trip.spots
              .filter((spot) => {
                // spot is unassigned if it's not in any segment
                return !trip.days.some((d) =>
                  d.segments.some((s) => s.fromSpotId === spot.id || s.toSpotId === spot.id)
                );
              })
              .map((spot) => (
                <div key={spot.id} className={styles.spotItem}>
                  {spot.name}
                </div>
              ))}
          </div>
        )}
      </div>

      <button className={styles.addDay} onClick={() => addDay()}>
        + Add Day
      </button>
    </div>
  );
}
```

Create `src/components/SidePanel/SidePanel.module.css`:

```css
.panel {
  width: 280px;
  min-width: 280px;
  background: #16213e;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.dayPlaceholder {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: #1a1a3e;
  border-radius: 4px;
  font-size: 14px;
}

.segCount {
  font-size: 12px;
  color: #888;
}

.section {
  margin-top: 12px;
}

.sectionHeader {
  font-size: 12px;
  text-transform: uppercase;
  color: #888;
  padding: 4px 12px;
  letter-spacing: 0.5px;
}

.spotItem {
  padding: 8px 12px;
  font-size: 13px;
  color: #ccc;
}

.addDay {
  padding: 10px;
  background: #2d2d44;
  color: #aaa;
  border: none;
  border-top: 1px solid #333;
  cursor: pointer;
  font-size: 13px;
}

.addDay:hover {
  background: #3d3d5c;
  color: #fff;
}
```

**Step 4: Create DetailBar placeholder**

Create `src/components/DetailBar/DetailBar.tsx`:

```tsx
import { useSelection } from '../../hooks/useSelection';
import { useTrip } from '../../hooks/useTrip';
import styles from './DetailBar.module.css';

export default function DetailBar() {
  const { selectedSpotId, selectedSegmentId, selectedSegmentDayId, clearSelection } = useSelection();
  const { trip } = useTrip();

  if (!selectedSpotId && !selectedSegmentId) return null;

  let title = '';
  if (selectedSpotId) {
    const spot = trip.spots.find((s) => s.id === selectedSpotId);
    title = spot ? spot.name : 'Unknown Spot';
  } else if (selectedSegmentId && selectedSegmentDayId) {
    const day = trip.days.find((d) => d.id === selectedSegmentDayId);
    const segment = day?.segments.find((s) => s.id === selectedSegmentId);
    if (segment) {
      const from = trip.spots.find((s) => s.id === segment.fromSpotId);
      const to = trip.spots.find((s) => s.id === segment.toSpotId);
      title = `${from?.name ?? '?'} → ${to?.name ?? '?'}`;
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.close} onClick={clearSelection}>
          ✕
        </button>
      </div>
      <div className={styles.body}>
        {/* Full editing UI built in Task 9 */}
        <p className={styles.placeholder}>Detail editing coming soon...</p>
      </div>
    </div>
  );
}
```

Create `src/components/DetailBar/DetailBar.module.css`:

```css
.bar {
  background: #1a1a2e;
  color: #e0e0e0;
  border-top: 1px solid #444;
  padding: 12px 16px;
  flex-shrink: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title {
  font-size: 15px;
  font-weight: 600;
}

.close {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
}

.close:hover {
  color: #fff;
}

.body {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.placeholder {
  color: #666;
  font-size: 13px;
}
```

**Step 5: Wire up App layout**

Update `src/App.tsx`:

```tsx
import styles from './App.module.css';
import Toolbar from './components/Toolbar';
import SidePanel from './components/SidePanel/SidePanel';
import DetailBar from './components/DetailBar/DetailBar';
import LeafletMap from './map/LeafletMap';
import { useTrip } from './hooks/useTrip';
import { useSelection } from './hooks/useSelection';
import { getSegmentColor, getSegmentWidth } from './utils/colors';
import { Spot } from './types';

function App() {
  const { trip } = useTrip();
  const { selectedSpotId, selectedSegmentId, selectSpot, selectSegment } = useSelection();

  const markers = trip.spots.map((spot) => ({
    spot,
    isSelected: spot.id === selectedSpotId,
  }));

  const routes = trip.days.flatMap((day) =>
    day.segments
      .filter((seg) => seg.routeGeometry)
      .map((seg) => ({
        segmentId: seg.id,
        positions: seg.routeGeometry!.coordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        ),
        color: getSegmentColor(seg, day),
        width: getSegmentWidth(seg),
        isSelected: seg.id === selectedSegmentId,
      }))
  );

  const handleMarkerClick = (spot: Spot) => {
    selectSpot(spot.id);
  };

  const handleRouteClick = (segmentId: string) => {
    const day = trip.days.find((d) => d.segments.some((s) => s.id === segmentId));
    if (day) {
      selectSegment(segmentId, day.id);
    }
  };

  return (
    <div className={styles.app}>
      <Toolbar />
      <div className={styles.main}>
        <SidePanel />
        <div className={styles.mapArea}>
          <LeafletMap
            markers={markers}
            routes={routes}
            onMarkerClick={handleMarkerClick}
            onRouteClick={handleRouteClick}
          />
        </div>
      </div>
      <DetailBar />
    </div>
  );
}

export default App;
```

Update `src/App.module.css`:

```css
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0f0f23;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.mapArea {
  flex: 1;
  position: relative;
}
```

**Step 6: Add global CSS reset**

Ensure `src/main.tsx` imports a minimal reset. Update or create `src/index.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

Make sure `src/main.tsx` imports it:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 7: Verify the layout renders**

Run: `npm run dev`
Expected: Dark themed app with toolbar at top, side panel on left (with "+ Add Day" button), map filling the rest. Clicking "Add Day" should add a day entry in the side panel.

**Step 8: Commit**

```bash
git add src/
git commit -m "feat: add app layout shell with toolbar, side panel, map, and detail bar"
```

---

### Task 7: Search Bar + Adding Spots

**Files:**
- Create: `src/components/SearchBar.tsx`, `src/components/SearchBar.module.css`
- Create: `src/hooks/useSearch.ts`
- Modify: `src/App.tsx`

**Step 1: Create search hook**

Create `src/hooks/useSearch.ts`:

```ts
import { useState, useRef, useCallback } from 'react';
import { SearchResult } from '../types';
import { searchPlaces } from '../services/geocoding';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchPlaces(q);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return { query, results, loading, search, clearSearch };
}
```

**Step 2: Create SearchBar component**

Create `src/components/SearchBar.tsx`:

```tsx
import { useSearch } from '../hooks/useSearch';
import { SearchResult } from '../types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
}

export default function SearchBar({ onResultSelect }: SearchBarProps) {
  const { query, results, loading, search, clearSearch } = useSearch();

  const handleSelect = (result: SearchResult) => {
    onResultSelect(result);
    clearSearch();
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search places..."
          value={query}
          onChange={(e) => search(e.target.value)}
        />
        {loading && <span className={styles.spinner} />}
        {query && !loading && (
          <button className={styles.clear} onClick={clearSearch}>
            ✕
          </button>
        )}
      </div>
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r, i) => (
            <li key={i} className={styles.resultItem} onClick={() => handleSelect(r)}>
              <span className={styles.resultName}>{r.name}</span>
              <span className={styles.resultDetail}>{r.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Create `src/components/SearchBar.module.css`:

```css
.container {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  width: 320px;
}

.inputWrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: none;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  outline: none;
}

.input:focus {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.spinner {
  position: absolute;
  right: 10px;
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top-color: #4285F4;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
}

.results {
  list-style: none;
  margin-top: 4px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  max-height: 300px;
  overflow-y: auto;
}

.resultItem {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.resultItem:last-child {
  border-bottom: none;
}

.resultItem:hover {
  background: #f5f7fa;
}

.resultName {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #222;
}

.resultDetail {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Step 3: Wire SearchBar into App + temporary markers + spot creation**

Update `src/App.tsx` to:
- Add `SearchBar` floating over the map area
- Track temporary search result markers
- On clicking a temporary marker, convert it to a confirmed spot using `addSpot`
- Clear temporary markers when search is cleared

The key additions:

```tsx
// Add to imports
import SearchBar from './components/SearchBar';
import { useState } from 'react';
import { SearchResult } from './types';

// Inside App component, add:
const [tempMarkers, setTempMarkers] = useState<SearchResult[]>([]);
const { addSpot } = useTrip(); // destructure addSpot

// Handler for search result selection
const handleSearchResult = (result: SearchResult) => {
  setTempMarkers((prev) => [...prev, result]);
};

// Handler for clicking a temporary marker — promote to spot
const handleTempMarkerClick = (spotLike: Spot) => {
  // Find matching temp marker to get original data
  const temp = tempMarkers.find(
    (t) => t.coordinates[0] === spotLike.coordinates[0] && t.coordinates[1] === spotLike.coordinates[1]
  );
  if (temp) {
    const newSpot = addSpot({
      name: temp.name,
      coordinates: temp.coordinates,
    });
    selectSpot(newSpot.id);
    setTempMarkers((prev) => prev.filter((t) => t !== temp));
  }
};

// Merge temp markers into the markers array with isTemporary flag
// Temp markers get a fake spot structure for rendering
const allMarkers = [
  ...markers,
  ...tempMarkers.map((t, i) => ({
    spot: { id: `temp-${i}`, name: t.name, coordinates: t.coordinates } as Spot,
    isTemporary: true,
  })),
];

// In JSX, within mapArea div, add SearchBar and pass allMarkers to LeafletMap
// Also handle onMarkerClick to distinguish temp vs real
```

The full wiring details are in the code above — the implementer should integrate these into the existing App.tsx, using `allMarkers` for the LeafletMap `markers` prop, and routing marker clicks through a handler that checks `isTemporary`.

**Step 4: Verify search and spot creation works**

Run: `npm run dev`
Expected: Floating search bar on map. Type a place name, see dropdown results. Click result, temporary (pulsing) marker appears on map. Click the temporary marker, it becomes a permanent spot. Spot appears in side panel under "Unassigned".

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: add search bar with geocoding and spot creation"
```

---

### Task 8: Segment Creation Workflow

**Files:**
- Create: `src/hooks/useSegmentCreation.ts`
- Create: `src/components/DayPickerModal.tsx`, `src/components/DayPickerModal.module.css`
- Modify: `src/App.tsx`

**Step 1: Create segment creation hook**

Create `src/hooks/useSegmentCreation.ts`:

```ts
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
```

**Step 2: Create DayPickerModal**

Create `src/components/DayPickerModal.tsx`:

```tsx
import { useTrip } from '../hooks/useTrip';
import styles from './DayPickerModal.module.css';

interface DayPickerModalProps {
  onSelectDay: (dayId: string) => void;
  onCreateDay: () => void;
  onCancel: () => void;
}

export default function DayPickerModal({ onSelectDay, onCreateDay, onCancel }: DayPickerModalProps) {
  const { trip } = useTrip();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Assign to Day</h3>
        <div className={styles.dayList}>
          {trip.days.map((day) => (
            <button
              key={day.id}
              className={styles.dayBtn}
              onClick={() => onSelectDay(day.id)}
            >
              <span className={styles.dayColor} style={{ background: day.color }} />
              {day.label}
            </button>
          ))}
        </div>
        <button className={styles.createBtn} onClick={onCreateDay}>
          + New Day
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

Create `src/components/DayPickerModal.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: #1a1a2e;
  color: #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  min-width: 260px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.title {
  font-size: 16px;
  margin-bottom: 12px;
}

.dayList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.dayBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #2d2d44;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

.dayBtn:hover {
  background: #3d3d5c;
}

.dayColor {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.createBtn {
  width: 100%;
  padding: 8px;
  background: #34A853;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 8px;
}

.createBtn:hover {
  background: #2d9249;
}

.cancelBtn {
  width: 100%;
  padding: 8px;
  background: transparent;
  color: #888;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.cancelBtn:hover {
  color: #fff;
}
```

**Step 3: Wire segment creation into App**

Update `src/App.tsx` to:
- Import `useSegmentCreation` and `useRouting`
- On marker click: if no `firstSpotId` is set, start creation. If `firstSpotId` is set, set second spot → show DayPickerModal
- On day selection in modal: call `useRouting.createSegment()` with the two spot coordinates, then reset creation state
- On "New Day" in modal: call `addDay()`, then create the segment in that new day

The marker click handler becomes:

```tsx
const handleMarkerClick = (spot: Spot) => {
  // If it's a temp marker, promote to spot (existing logic)
  // If it's a real spot:
  if (!segmentCreation.firstSpotId) {
    segmentCreation.startCreation(spot.id);
    selectSpot(spot.id);
  } else if (spot.id !== segmentCreation.firstSpotId) {
    segmentCreation.setSecondSpot(spot.id);
  }
};
```

The DayPickerModal handlers:

```tsx
const handleDaySelect = async (dayId: string) => {
  const { firstSpotId, secondSpotId } = segmentCreation;
  if (!firstSpotId || !secondSpotId) return;
  const fromSpot = trip.spots.find((s) => s.id === firstSpotId);
  const toSpot = trip.spots.find((s) => s.id === secondSpotId);
  if (!fromSpot || !toSpot) return;
  await routing.createSegment(dayId, firstSpotId, secondSpotId, fromSpot.coordinates, toSpot.coordinates);
  segmentCreation.reset();
};

const handleCreateDayAndSegment = async () => {
  const newDay = addDay();
  await handleDaySelect(newDay.id);
};
```

**Step 4: Verify segment creation works**

Run: `npm run dev`
Expected: Search and add two spots. Click first spot (selected/highlighted). Click second spot → DayPickerModal appears. Click "+ New Day" → route appears on map connecting the two spots. Segment appears in side panel under that day.

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: add segment creation workflow with day picker and OSRM routing"
```

---

### Task 9: Detail Bar — Full Editing UI

**Files:**
- Create: `src/components/DetailBar/SpotDetail.tsx`
- Create: `src/components/DetailBar/SegmentDetail.tsx`
- Modify: `src/components/DetailBar/DetailBar.tsx`
- Modify: `src/components/DetailBar/DetailBar.module.css`

**Step 1: Create SpotDetail component**

Create `src/components/DetailBar/SpotDetail.tsx`:

```tsx
import { Spot } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import styles from './DetailBar.module.css';

interface SpotDetailProps {
  spot: Spot;
}

export default function SpotDetail({ spot }: SpotDetailProps) {
  const { updateSpot, removeSpot } = useTrip();

  return (
    <div className={styles.fields}>
      <label className={styles.field}>
        <span className={styles.label}>Name</span>
        <input
          className={styles.input}
          value={spot.name}
          onChange={(e) => updateSpot(spot.id, { name: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Link</span>
        <input
          className={styles.input}
          value={spot.link ?? ''}
          placeholder="https://..."
          onChange={(e) => updateSpot(spot.id, { link: e.target.value || undefined })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Notes</span>
        <textarea
          className={styles.textarea}
          value={spot.notes ?? ''}
          placeholder="Add notes..."
          rows={2}
          onChange={(e) => updateSpot(spot.id, { notes: e.target.value || undefined })}
        />
      </label>
      <button className={styles.deleteBtn} onClick={() => removeSpot(spot.id)}>
        Remove Spot
      </button>
    </div>
  );
}
```

**Step 2: Create SegmentDetail component**

Create `src/components/DetailBar/SegmentDetail.tsx`:

```tsx
import { Segment, Day } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import { getSegmentColor, getSegmentWidth, DEFAULT_SEGMENT_WIDTH } from '../../utils/colors';
import styles from './DetailBar.module.css';

interface SegmentDetailProps {
  segment: Segment;
  day: Day;
}

export default function SegmentDetail({ segment, day }: SegmentDetailProps) {
  const { updateSegment, removeSegment } = useTrip();
  const dayId = day.id;

  const effectiveColor = getSegmentColor(segment, day);
  const effectiveWidth = getSegmentWidth(segment);

  return (
    <div className={styles.fields}>
      <label className={styles.field}>
        <span className={styles.label}>Link</span>
        <input
          className={styles.input}
          value={segment.link ?? ''}
          placeholder="https://..."
          onChange={(e) =>
            updateSegment(dayId, segment.id, { link: e.target.value || undefined })
          }
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Notes</span>
        <textarea
          className={styles.textarea}
          value={segment.notes ?? ''}
          placeholder="Add notes..."
          rows={2}
          onChange={(e) =>
            updateSegment(dayId, segment.id, { notes: e.target.value || undefined })
          }
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Color</span>
        <div className={styles.colorRow}>
          <input
            type="color"
            value={effectiveColor}
            onChange={(e) => updateSegment(dayId, segment.id, { color: e.target.value })}
          />
          {segment.color && (
            <button
              className={styles.resetBtn}
              onClick={() => updateSegment(dayId, segment.id, { color: undefined })}
            >
              Reset to day color
            </button>
          )}
        </div>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Width ({effectiveWidth}px)</span>
        <input
          type="range"
          min="1"
          max="12"
          value={effectiveWidth}
          onChange={(e) =>
            updateSegment(dayId, segment.id, { width: parseInt(e.target.value) })
          }
        />
        {segment.width && segment.width !== DEFAULT_SEGMENT_WIDTH && (
          <button
            className={styles.resetBtn}
            onClick={() => updateSegment(dayId, segment.id, { width: undefined })}
          >
            Reset width
          </button>
        )}
      </label>
      <button
        className={styles.deleteBtn}
        onClick={() => removeSegment(dayId, segment.id)}
      >
        Remove Segment
      </button>
    </div>
  );
}
```

**Step 3: Update DetailBar to use SpotDetail and SegmentDetail**

Update `src/components/DetailBar/DetailBar.tsx` to render `SpotDetail` when a spot is selected and `SegmentDetail` when a segment is selected, replacing the placeholder text.

**Step 4: Add field styles to DetailBar.module.css**

Append to `src/components/DetailBar/DetailBar.module.css`:

```css
.fields {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.5px;
}

.input {
  padding: 6px 8px;
  background: #2d2d44;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}

.input:focus {
  border-color: #4285F4;
}

.textarea {
  padding: 6px 8px;
  background: #2d2d44;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 13px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.textarea:focus {
  border-color: #4285F4;
}

.colorRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resetBtn {
  background: none;
  border: none;
  color: #4285F4;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.resetBtn:hover {
  text-decoration: underline;
}

.deleteBtn {
  padding: 6px 12px;
  background: #EA4335;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  align-self: flex-end;
}

.deleteBtn:hover {
  background: #d33426;
}
```

**Step 5: Verify detail editing works**

Run: `npm run dev`
Expected: Click a spot marker → detail bar slides up with name, link, notes fields, and "Remove Spot" button. Click a route polyline → detail bar shows link, notes, color picker, width slider, and "Remove Segment" button. Edits persist (localStorage).

**Step 6: Commit**

```bash
git add src/components/DetailBar/
git commit -m "feat: add spot and segment detail editing in detail bar"
```

---

### Task 10: Side Panel — Day Accordion with Segments & Drag-and-Drop

**Files:**
- Create: `src/components/SidePanel/DayAccordion.tsx`, `src/components/SidePanel/DayAccordion.module.css`
- Create: `src/components/SidePanel/SegmentItem.tsx`, `src/components/SidePanel/SegmentItem.module.css`
- Create: `src/components/SidePanel/UnassignedSpots.tsx`, `src/components/SidePanel/UnassignedSpots.module.css`
- Modify: `src/components/SidePanel/SidePanel.tsx`

**Step 1: Create SegmentItem**

Create `src/components/SidePanel/SegmentItem.tsx`:

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Segment } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import { useSelection } from '../../hooks/useSelection';
import styles from './SegmentItem.module.css';

interface SegmentItemProps {
  segment: Segment;
  dayId: string;
  color: string;
}

export default function SegmentItem({ segment, dayId, color }: SegmentItemProps) {
  const { trip } = useTrip();
  const { selectedSegmentId, selectSegment } = useSelection();
  const isSelected = selectedSegmentId === segment.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: segment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const from = trip.spots.find((s) => s.id === segment.fromSpotId);
  const to = trip.spots.find((s) => s.id === segment.toSpotId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={() => selectSegment(segment.id, dayId)}
      {...attributes}
      {...listeners}
    >
      <span className={styles.colorDot} style={{ background: segment.color ?? color }} />
      <span className={styles.label}>
        {from?.name ?? '?'} → {to?.name ?? '?'}
      </span>
    </div>
  );
}
```

Create `src/components/SidePanel/SegmentItem.module.css`:

```css
.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: grab;
  border-radius: 3px;
  font-size: 13px;
}

.item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item.selected {
  background: rgba(66, 133, 244, 0.2);
}

.colorDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Step 2: Create DayAccordion**

Create `src/components/SidePanel/DayAccordion.tsx`:

```tsx
import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Day } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import SegmentItem from './SegmentItem';
import styles from './DayAccordion.module.css';

interface DayAccordionProps {
  day: Day;
}

export default function DayAccordion({ day }: DayAccordionProps) {
  const [expanded, setExpanded] = useState(true);
  const { updateDay, removeDay } = useTrip();
  const [editing, setEditing] = useState(false);

  return (
    <div className={styles.accordion}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.colorDot} style={{ background: day.color }} />
        {editing ? (
          <input
            className={styles.labelInput}
            value={day.label}
            onChange={(e) => updateDay(day.id, { label: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className={styles.label}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {day.label}
          </span>
        )}
        <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
        <button
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove ${day.label}?`)) removeDay(day.id);
          }}
        >
          ✕
        </button>
      </div>
      {expanded && (
        <div className={styles.body}>
          {day.segments.length === 0 ? (
            <div className={styles.empty}>No segments yet</div>
          ) : (
            <SortableContext items={day.segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {day.segments.map((seg) => (
                <SegmentItem key={seg.id} segment={seg} dayId={day.id} color={day.color} />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
```

Create `src/components/SidePanel/DayAccordion.module.css`:

```css
.accordion {
  margin-bottom: 4px;
  border-radius: 4px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #1a1a3e;
  cursor: pointer;
  font-size: 14px;
}

.header:hover {
  background: #222250;
}

.colorDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.label {
  flex: 1;
  cursor: default;
}

.labelInput {
  flex: 1;
  background: #2d2d44;
  border: 1px solid #555;
  color: #e0e0e0;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 14px;
  outline: none;
}

.chevron {
  color: #888;
  font-size: 12px;
}

.removeBtn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}

.removeBtn:hover {
  color: #EA4335;
}

.body {
  padding: 4px 0;
  background: #161638;
}

.empty {
  padding: 8px 20px;
  font-size: 12px;
  color: #666;
  font-style: italic;
}
```

**Step 3: Create UnassignedSpots**

Create `src/components/SidePanel/UnassignedSpots.tsx`:

```tsx
import { useTrip } from '../../hooks/useTrip';
import { useSelection } from '../../hooks/useSelection';
import styles from './UnassignedSpots.module.css';

export default function UnassignedSpots() {
  const { trip } = useTrip();
  const { selectedSpotId, selectSpot } = useSelection();

  const assignedSpotIds = new Set(
    trip.days.flatMap((d) => d.segments.flatMap((s) => [s.fromSpotId, s.toSpotId]))
  );

  const unassigned = trip.spots.filter((s) => !assignedSpotIds.has(s.id));

  if (unassigned.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.header}>Unassigned Spots</div>
      {unassigned.map((spot) => (
        <div
          key={spot.id}
          className={`${styles.item} ${selectedSpotId === spot.id ? styles.selected : ''}`}
          onClick={() => selectSpot(spot.id)}
        >
          {spot.name}
        </div>
      ))}
    </div>
  );
}
```

Create `src/components/SidePanel/UnassignedSpots.module.css`:

```css
.section {
  margin-top: 12px;
  border-top: 1px solid #333;
  padding-top: 8px;
}

.header {
  font-size: 11px;
  text-transform: uppercase;
  color: #888;
  padding: 4px 12px;
  letter-spacing: 0.5px;
}

.item {
  padding: 6px 12px;
  font-size: 13px;
  color: #ccc;
  cursor: pointer;
  border-radius: 3px;
}

.item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item.selected {
  background: rgba(66, 133, 244, 0.2);
}
```

**Step 4: Update SidePanel to use real components with DndContext**

Replace the placeholder SidePanel with the real components. Wrap in `DndContext` from `@dnd-kit/core` to enable drag-and-drop reordering. Handle `onDragEnd` to call `reorderSegments`.

**Step 5: Verify side panel works**

Run: `npm run dev`
Expected: Days show as accordions with expand/collapse. Segments listed under each day. Double-click day label to rename. Unassigned spots section shows. Click items to select them on map. Drag segments to reorder within a day.

**Step 6: Commit**

```bash
git add src/components/SidePanel/
git commit -m "feat: add day accordion, segment items, unassigned spots with drag-and-drop"
```

---

### Task 11: Final Integration & Polish

**Files:**
- Modify: `src/App.tsx` (final wiring)
- Modify: various CSS files for polish

**Step 1: Ensure all interactions are connected**

Verify end-to-end flow:
1. Search → add spot → spot appears on map + side panel
2. Click two spots → pick day → route rendered
3. Click spot/segment → detail bar opens with editing
4. Edit color/width → route updates on map
5. Drag-and-drop reorder in side panel
6. Export → download JSON. Import → restores state.
7. Page refresh → state restored from localStorage.

**Step 2: Add a status indicator for segment creation mode**

When the user has clicked the first spot and is waiting to click the second, show a small floating hint on the map like "Click another spot to create a route" so they know what's happening.

**Step 3: Handle edge cases**

- Deleting a spot that's part of segments → segments auto-removed (already handled in store)
- Deleting a day → segments gone but spots remain
- Empty trip state → show a helpful "Search for a place to get started" hint on the map
- OSRM failure → show error message, don't create a broken segment

**Step 4: Verify full app works end-to-end**

Run: `npm run dev`
Test the complete workflow from adding spots, creating routes, editing details, reordering, export/import, and page refresh persistence.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: final integration and polish for travel planner v1"
```
