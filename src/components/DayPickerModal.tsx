import { useTrip } from '../hooks/useTrip';
import styles from './DayPickerModal.module.css';

interface DayPickerModalProps {
  onSelectDay: (dayId: string) => void;
  onCreateDay: () => void;
  onCancel: () => void;
}

export default function DayPickerModal({ onSelectDay, onCreateDay, onCancel }: DayPickerModalProps) {
  const { trip } = useTrip();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Assign to Day</h3>
        <div className={styles.dayList}>
          {trip.days.map((day) => (
            <button
              key={day.id}
              className={styles.dayBtn}
              onClick={() => onSelectDay(day.id)}
            >
              <span className={styles.dayColor} style={{ background: day.color }} />
              {day.label}
            </button>
          ))}
        </div>
        <button className={styles.createBtn} onClick={onCreateDay}>
          + New Day
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
