import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Spot } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import { useSelection } from '../../hooks/useSelection';
import styles from './DaySpotItem.module.css';

interface DaySpotItemProps {
  spot: Spot;
  index: number;
  dayColor: string;
  dayId: string;
  isStay: boolean;
}

export default function DaySpotItem({ spot, index, dayColor, dayId, isStay }: DaySpotItemProps) {
  const { removeSpotFromDay, updateDay } = useTrip();
  const { selectedSpotId, selectSpot } = useSelection();
  const isSelected = selectedSpotId === spot.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: spot.id,
    data: { dayId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={() => selectSpot(spot.id)}
      {...attributes}
      {...listeners}
    >
      <span className={styles.index}>{index + 1}</span>
      <span className={styles.colorDot} style={{ background: dayColor }} />
      <span className={styles.name}>{spot.name}</span>
      <button
        className={`${styles.stayBtn} ${isStay ? styles.stayActive : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          updateDay(dayId, { staySpotId: isStay ? undefined : spot.id });
        }}
        title={isStay ? 'Clear stay' : 'Set as overnight stay'}
      >
        &#9789;
      </button>
      <button
        className={styles.removeBtn}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          removeSpotFromDay(dayId, spot.id);
        }}
        title="Remove from day"
      >
        &times;
      </button>
    </div>
  );
}
