import { useState } from 'react';
import styles from './App.module.css';
import Toolbar from './components/Toolbar';
import SidePanel from './components/SidePanel/SidePanel';
import SpotInfoCard from './components/SpotInfoCard';
import SearchBar from './components/SearchBar';
import DayPickerModal from './components/DayPickerModal';
import LeafletMap from './map/LeafletMap';
import { useTrip } from './hooks/useTrip';
import { useSelection } from './hooks/useSelection';
import { useSegmentCreation } from './hooks/useSegmentCreation';
import { useRouting } from './hooks/useRouting';
import { getSegmentColor, getSegmentWidth } from './utils/colors';
import type { Spot, SearchResult } from './types';

function App() {
  const { trip, addSpot, addDay } = useTrip();
  const { selectedSpotId, selectedSegmentId, selectSpot, selectSegment, clearSelection } = useSelection();
  const segmentCreation = useSegmentCreation();
  const routing = useRouting();
  const [pendingSpot, setPendingSpot] = useState<SearchResult | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);

  const routeMode = !!segmentCreation.firstSpotId;

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
    selectSpot(newSpot.id);
    setPendingSpot(null);
    setFlyToLocation(null);
    void dayId;
  };

  const handleMarkerClick = (spot: Spot) => {
    if (routeMode) {
      // In route mode, clicking a second spot completes the pair
      if (spot.id !== segmentCreation.firstSpotId) {
        segmentCreation.setSecondSpot(spot.id);
      }
    } else {
      // Normal mode — just select the spot
      selectSpot(spot.id);
    }
  };

  const handleStartRouteCreation = (spotId: string) => {
    segmentCreation.startCreation(spotId);
  };

  const handleMapClick = () => {
    if (!routeMode) {
      clearSelection();
    }
    setPendingSpot(null);
    setFlyToLocation(null);
  };

  const handleDaySelect = async (dayId: string) => {
    const { firstSpotId, secondSpotId } = segmentCreation;
    if (!firstSpotId || !secondSpotId) return;
    const fromSpot = trip.spots.find((s) => s.id === firstSpotId);
    const toSpot = trip.spots.find((s) => s.id === secondSpotId);
    if (!fromSpot || !toSpot) return;
    const result = await routing.createSegment(dayId, firstSpotId, secondSpotId, fromSpot.coordinates, toSpot.coordinates);
    if (!result) {
      alert('Failed to fetch route. The segment was not created.');
    }
    segmentCreation.reset();
  };

  const handleCreateDayAndSegment = async () => {
    const newDay = addDay();
    await handleDaySelect(newDay.id);
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
          {routeMode && !segmentCreation.isPickingDay && (
            <div className={styles.statusHint}>
              Click another spot to create a route
            </div>
          )}
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
          {selectedSpot && !routeMode && (
            <SpotInfoCard
              spot={selectedSpot}
              onClose={clearSelection}
              onStartRoute={handleStartRouteCreation}
            />
          )}
        </div>
      </div>
      {segmentCreation.isPickingDay && (
        <DayPickerModal
          onSelectDay={handleDaySelect}
          onCreateDay={handleCreateDayAndSegment}
          onCancel={() => segmentCreation.cancel()}
        />
      )}
    </div>
  );
}

export default App;
