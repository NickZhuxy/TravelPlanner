import { useTrip } from '../../hooks/useTrip';
import { useSelection } from '../../hooks/useSelection';
import styles from './UnassignedSpots.module.css';

export default function UnassignedSpots() {
  const { trip } = useTrip();
  const { selectedSpotId, selectSpot } = useSelection();

  const assignedSpotIds = new Set(
    trip.days.flatMap((d) => d.spotIds)
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
