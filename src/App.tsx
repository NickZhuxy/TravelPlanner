import { useState } from 'react';
import styles from './App.module.css';
import Toolbar from './components/Toolbar';
import SidePanel from './components/SidePanel/SidePanel';
import DetailBar from './components/DetailBar/DetailBar';
import SearchBar from './components/SearchBar';
import LeafletMap from './map/LeafletMap';
import { useTrip } from './hooks/useTrip';
import { useSelection } from './hooks/useSelection';
import { getSegmentColor, getSegmentWidth } from './utils/colors';
import type { Spot, SearchResult } from './types';

function App() {
  const { trip, addSpot } = useTrip();
  const { selectedSpotId, selectedSegmentId, selectSpot, selectSegment } = useSelection();
  const [tempMarkers, setTempMarkers] = useState<SearchResult[]>([]);

  const markers = trip.spots.map((spot) => ({
    spot,
    isSelected: spot.id === selectedSpotId,
  }));

  const tempSpots = tempMarkers.map((t, i) => ({
    spot: { id: `temp-${i}`, name: t.name, coordinates: t.coordinates } as Spot,
    isTemporary: true,
  }));

  const allMarkers = [...markers, ...tempSpots];

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
    setTempMarkers((prev) => [...prev, result]);
  };

  const handleMarkerClick = (spot: Spot) => {
    // Check if it's a temporary marker
    if (spot.id.startsWith('temp-')) {
      const temp = tempMarkers.find(
        (t) => t.coordinates[0] === spot.coordinates[0] && t.coordinates[1] === spot.coordinates[1]
      );
      if (temp) {
        const newSpot = addSpot({
          name: temp.name,
          coordinates: temp.coordinates,
        });
        selectSpot(newSpot.id);
        setTempMarkers((prev) => prev.filter((t) => t !== temp));
      }
      return;
    }
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
          <SearchBar onResultSelect={handleSearchResult} />
          <LeafletMap
            markers={allMarkers}
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
