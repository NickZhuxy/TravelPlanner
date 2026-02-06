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
