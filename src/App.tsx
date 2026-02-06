import styles from './App.module.css';
import Toolbar from './components/Toolbar';
import SidePanel from './components/SidePanel/SidePanel';
import DetailBar from './components/DetailBar/DetailBar';
import LeafletMap from './map/LeafletMap';
import { useTrip } from './hooks/useTrip';
import { useSelection } from './hooks/useSelection';
import { getSegmentColor, getSegmentWidth } from './utils/colors';
import type { Spot } from './types';

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
