# Travel Planner — Design Document

## Overview

A road trip planning web app that lets users plan multi-day routes on an interactive map. Users can search for and add spots, connect them with driving-direction segments organized by day, and annotate everything with links and notes. Routes are visually differentiated by color and width.

## Data Model

```
Trip
  id, name, description
  spots: Spot[]          — independent, not tied to any day
  days: Day[]            — ordered list

Spot
  id, name
  coordinates: [lat, lng]
  link (optional URL)
  notes (optional text)

Day
  id, label (e.g., "Day 1 - Coast Drive")
  color (auto-assigned from palette, user can override)
  segments: Segment[]

Segment
  id
  fromSpotId, toSpotId
  routeGeometry: GeoJSON   — actual road path from OSRM
  link (optional URL)
  notes (optional text)
  color (inherits from Day, can override)
  width (default, can override)
```

Key decisions:
- Spots exist independently — can be added without assigning to any day/segment
- A spot can be referenced by multiple segments
- Segments store OSRM route geometry to avoid re-fetching on every render
- Days auto-assign colors; segments inherit but can override

## Map Layer Abstraction

To support swapping Leaflet for MapLibre or Google Maps later:

```
MapProvider (interface)
  renderMap(center, zoom)
  addMarker(spot) -> MarkerHandle
  addPolyline(geometry, style) -> PolylineHandle
  removeMarker(handle)
  removePolyline(handle)
  fitBounds(bounds)
  onMapClick(callback)
  geocode(query) -> SearchResult[]

LeafletProvider implements MapProvider
  — uses react-leaflet + Nominatim for geocoding
```

Components never import react-leaflet directly — they use MapProvider context. To add another provider later, implement the same interface and swap at the top level. Geocoding is also behind this abstraction.

## UI Layout

```
+--------------------------------------------------+
|  Toolbar: [Trip Name]             [Export] [Import]|
+---------------+----------------------------------+
|  Side Panel   |                                    |
|  +----------+ |          MAP                       |
|  | Day 1  v | |                                    |
|  |  A -> B  | |    [ Search places... ]            |
|  |  B -> C  | |                                    |
|  +----------+ |       * Spot A                     |
|  | Day 2  v | |         \                          |
|  |  C -> D  | |          * Spot B                  |
|  +----------+ |           \                        |
|  | Unassigned| |           * Spot C                |
|  |  * Spot E | |                                    |
|  |  * Spot F | |                                    |
|  +----------+ |                                    |
|  [+ Add Day]  |                                    |
+---------------+----------------------------------+
|  Detail Bar (when spot/segment selected)           |
|  [Name] [Link] [Notes] [Color/Width if segment]   |
+--------------------------------------------------+
```

- Side panel: collapsible accordion per day, "Unassigned" section, "+ Add Day"
- Map: floating search bar, markers, route polylines
- Detail bar: slides up from bottom on selection

## Key Workflows

### Adding a spot
1. Type in floating search bar on the map
2. Nominatim results appear as temporary markers
3. Click a temporary marker to confirm as a spot
4. Spot appears under "Unassigned" in side panel
5. Detail bar opens for editing name/link/notes

### Creating a segment
1. Click a spot on the map to select it
2. Click a second spot to be prompted to create a segment
3. Pick which day to assign it to (or create a new day)
4. OSRM fetches driving route, polyline renders on map
5. Segment appears in side panel under that day

### Reordering
- Drag-and-drop segments within a day to reorder
- Drag segments between days to reassign
- Spots in "Unassigned" can only become part of a segment

### Editing route appearance
- Click route polyline or segment in side panel
- Detail bar shows color picker and width slider
- Changes apply immediately

### Export / Import
- Export: saves entire trip as JSON (spots, days, segments, route geometries)
- Import: loads JSON file, replaces current trip (with confirmation)

## Route Styling

- Each day auto-assigned a color from a predefined palette
- All segments in a day inherit that color by default
- Users can override color and width per individual segment
- Color picker and width slider in the detail bar

## Tech Stack

- React 18 + TypeScript
- Vite (build tooling)
- react-leaflet + leaflet (map rendering)
- OpenStreetMap tiles (free, no API key)
- Nominatim (free geocoding / spot search)
- OSRM demo server (free driving directions)
- Zustand (state management)
- dnd-kit (drag-and-drop)
- CSS Modules (styling)
- localStorage (persistence) + JSON export/import

## Project Structure

```
TravelPlanner/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    App.tsx
    types/
      index.ts              — Trip, Spot, Day, Segment types
    map/
      MapProvider.ts         — Abstract interface
      LeafletProvider.tsx    — Leaflet implementation
      MapContainer.tsx       — Renders map via provider
    components/
      SidePanel/
        SidePanel.tsx
        DayAccordion.tsx
        SegmentItem.tsx
        UnassignedSpots.tsx
      DetailBar/
        DetailBar.tsx
        SpotDetail.tsx
        SegmentDetail.tsx
      SearchBar.tsx
      Toolbar.tsx
    hooks/
      useTrip.ts             — Core trip state management
      useMapInteraction.ts
      useRouting.ts          — OSRM integration
    services/
      routing.ts             — OSRM API calls
      geocoding.ts           — Nominatim API calls
      storage.ts             — localStorage + export/import
    utils/
      colors.ts              — Day color palette + auto-assign
      id.ts                  — ID generation
  public/
  docs/
    plans/
```

## Persistence

- All trip data stored in localStorage
- Auto-save on every state change
- Export downloads a .json file
- Import reads a .json file and replaces current state (with user confirmation)
- No backend required for v1
