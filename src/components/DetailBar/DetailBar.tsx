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
      title = `${from?.name ?? '?'} \u2192 ${to?.name ?? '?'}`;
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.close} onClick={clearSelection}>{'\u2715'}</button>
      </div>
      <div className={styles.body}>
        <p className={styles.placeholder}>Detail editing coming soon...</p>
      </div>
    </div>
  );
}
