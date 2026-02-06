import type { Spot } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import styles from './DetailBar.module.css';

interface SpotDetailProps {
  spot: Spot;
}

export default function SpotDetail({ spot }: SpotDetailProps) {
  const { updateSpot, removeSpot } = useTrip();

  return (
    <div className={styles.fields}>
      <label className={styles.field}>
        <span className={styles.label}>Name</span>
        <input
          className={styles.input}
          value={spot.name}
          onChange={(e) => updateSpot(spot.id, { name: e.target.value })}
        />
      </label>
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
      <button className={styles.deleteBtn} onClick={() => removeSpot(spot.id)}>
        Remove Spot
      </button>
    </div>
  );
}
