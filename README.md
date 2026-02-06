# TravelPlanner

A visual trip planning app built with React, TypeScript, and Leaflet. Plan multi-day itineraries by searching for places, organizing spots into days, and viewing auto-generated routes on an interactive map.

## Features

- **Search & Add Spots** — Geocoding-powered search bar to find and pin places on the map
- **Multi-Day Planning** — Organize spots into named, color-coded days with drag-and-drop reordering
- **Auto-Routing** — Routes between consecutive spots are fetched automatically via OSRM and drawn on the map
- **Transport Modes** — Toggle between walking and driving per route segment
- **Stay-at-Night** — Designate an overnight stay spot per day (defaults to last spot); the next day automatically starts from the previous night's stay
- **Persistent State** — Trip data is saved to localStorage and restored on reload

## Tech Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Leaflet](https://leafletjs.com/) via [react-leaflet](https://react-leaflet.js.org/) for the map
- [Zustand](https://zustand.docs.pmnd.rs/) for state management
- [@dnd-kit](https://dndkit.com/) for drag-and-drop
- [OSRM](https://project-osrm.org/) public API for routing
- CSS Modules for styling

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Build

```bash
npm run build
```
