import type { Day } from '../types';
import styles from './AddSpotPopup.module.css';

interface AddSpotPopupProps {
  name: string;
  address: string;
  days: Day[];
  onAddUndecided: () => void;
  onAddToDay: (dayId: string) => void;
}

export default function AddSpotPopup({
  name,
  address,
  days,
  onAddUndecided,
  onAddToDay,
}: AddSpotPopupProps) {
  return (
    <div className={styles.popup}>
      <p className={styles.name}>{name}</p>
      <p className={styles.address}>{address}</p>
      <button className={styles.addUndecided} onClick={onAddUndecided}>
        Add to Undecided
      </button>
      {days.length > 0 && (
        <>
          <div className={styles.divider}>or assign to day</div>
          <div className={styles.dayList}>
            {days.map((day) => (
              <button
                key={day.id}
                className={styles.dayButton}
                onClick={() => onAddToDay(day.id)}
              >
                <span
                  className={styles.dayColor}
                  style={{ background: day.color }}
                />
                {day.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
