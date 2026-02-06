import { useState } from 'react';
import styles from './App.module.css';
import Toolbar from './components/Toolbar';
import SidePanel from './components/SidePanel/SidePanel';
import SpotInfoCard from './components/SpotInfoCard';
import SearchBar from './components/SearchBar';
import LeafletMap from './map/LeafletMap';
import { useTrip } from './hooks/useTrip';
import { useSelection } from './hooks/useSelection';
import { useDayRoutes } from './hooks/useDayRoutes';
import { getSegmentColor, getSegmentWidth } from './utils/colors';
import type { Spot, SearchResult } from './types';

function App() {
  const { trip, addSpot, addSpotToDay } = useTrip();
  const { selectedSpotId, selectedSegmentId, selectSpot, selectSegment, clearSelection } = useSelection();
  const [pendingSpot, setPendingSpot] = useState<SearchResult | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);

  // Auto-sync segments for all days
  useDayRoutes();

  // Collect explicitly set stay spot IDs across days
  const staySpotIds = new Set(
    trip.days
      .filter((d) => d.staySpotId)
      .map((d) => d.staySpotId!)
  );

  const markers = trip.spots.map((spot) => ({
    spot,
    isSelected: spot.id === selectedSpotId,
    isStay: staySpotIds.has(spot.id),
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

  const handleSearchResult = (result: SearchResult) => {
    setPendingSpot(result);
    setFlyToLocation(result.coordinates);
  };

  const handleAddSpot = (dayId?: string) => {
    if (!pendingSpot) return;
    const newSpot = addSpot({
      name: pendingSpot.name,
      coordinates: pendingSpot.coordinates,
    });
    if (dayId) {
      addSpotToDay(dayId, newSpot.id);
    }
    selectSpot(newSpot.id);
    setPendingSpot(null);
    setFlyToLocation(null);
  };

  const handleMarkerClick = (spot: Spot) => {
    selectSpot(spot.id);
  };

  const handleMapClick = () => {
    clearSelection();
    setPendingSpot(null);
    setFlyToLocation(null);
  };

  const handleRouteClick = (segmentId: string) => {
    const day = trip.days.find((d) => d.segments.some((s) => s.id === segmentId));
    if (day) {
      selectSegment(segmentId, day.id);
    }
  };

  const selectedSpot = selectedSpotId
    ? trip.spots.find((s) => s.id === selectedSpotId) ?? null
    : null;

  return (
    <div className={styles.app}>
      <Toolbar />
      <div className={styles.main}>
        <SidePanel />
        <div className={styles.mapArea}>
          <SearchBar onResultSelect={handleSearchResult} />
          {trip.spots.length === 0 && !pendingSpot && (
            <div className={styles.emptyHint}>
              Search for a place to get started
            </div>
          )}
          <LeafletMap
            markers={markers}
            routes={routes}
            flyToLocation={flyToLocation}
            pendingMarker={pendingSpot ? pendingSpot.coordinates : null}
            pendingSpotInfo={pendingSpot ? { name: pendingSpot.name, address: pendingSpot.displayName } : null}
            days={trip.days}
            onAddSpot={handleAddSpot}
            onMarkerClick={handleMarkerClick}
            onRouteClick={handleRouteClick}
            onMapClick={handleMapClick}
          />
          {selectedSpot && (
            <SpotInfoCard
              spot={selectedSpot}
              onClose={clearSelection}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
