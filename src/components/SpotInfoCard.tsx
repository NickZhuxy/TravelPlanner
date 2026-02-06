import type { Spot } from '../types';
import { useTrip } from '../hooks/useTrip';
import styles from './SpotInfoCard.module.css';

interface SpotInfoCardProps {
  spot: Spot;
  onClose: () => void;
  onStartRoute: (spotId: string) => void;
}

export default function SpotInfoCard({ spot, onClose, onStartRoute }: SpotInfoCardProps) {
  const { updateSpot, removeSpot } = useTrip();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <input
          className={styles.nameInput}
          value={spot.name}
          onChange={(e) => updateSpot(spot.id, { name: e.target.value })}
        />
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className={styles.body}>
        <label className={styles.field}>
          <span className={styles.label}>Link</span>
          <input
            className={styles.input}
            value={spot.link ?? ''}
            placeholder="https://..."
            onChange={(e) => updateSpot(spot.id, { link: e.target.value || undefined })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Notes</span>
          <textarea
            className={styles.textarea}
            value={spot.notes ?? ''}
            placeholder="Add notes..."
            rows={2}
            onChange={(e) => updateSpot(spot.id, { notes: e.target.value || undefined })}
          />
        </label>
        <span className={styles.coords}>
          {spot.coordinates[0].toFixed(5)}, {spot.coordinates[1].toFixed(5)}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.routeBtn}
          onClick={() => onStartRoute(spot.id)}
        >
          Create Route
        </button>
        <button
          className={styles.removeBtn}
          onClick={() => {
            removeSpot(spot.id);
            onClose();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
