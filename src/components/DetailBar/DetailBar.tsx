import { useSelection } from '../../hooks/useSelection';
import { useTrip } from '../../hooks/useTrip';
import SpotDetail from './SpotDetail';
import SegmentDetail from './SegmentDetail';
import styles from './DetailBar.module.css';

export default function DetailBar() {
  const { selectedSpotId, selectedSegmentId, selectedSegmentDayId, clearSelection } = useSelection();
  const { trip } = useTrip();

  if (!selectedSpotId && !selectedSegmentId) return null;

  let title = '';
  let content = null;

  if (selectedSpotId) {
    const spot = trip.spots.find((s) => s.id === selectedSpotId);
    if (spot) {
      title = spot.name;
      content = <SpotDetail spot={spot} />;
    }
  } else if (selectedSegmentId && selectedSegmentDayId) {
    const day = trip.days.find((d) => d.id === selectedSegmentDayId);
    const segment = day?.segments.find((s) => s.id === selectedSegmentId);
    if (segment && day) {
      const from = trip.spots.find((s) => s.id === segment.fromSpotId);
      const to = trip.spots.find((s) => s.id === segment.toSpotId);
      title = `${from?.name ?? '?'} → ${to?.name ?? '?'}`;
      content = <SegmentDetail segment={segment} day={day} />;
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.close} onClick={clearSelection}>✕</button>
      </div>
      <div className={styles.body}>
        {content}
      </div>
    </div>
  );
}
