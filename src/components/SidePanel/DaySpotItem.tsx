import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Spot } from '../../types';
import { useSelection } from '../../hooks/useSelection';
import styles from './DaySpotItem.module.css';

interface DaySpotItemProps {
  spot: Spot;
  index: number;
  dayColor: string;
  dayId: string;
}

export default function DaySpotItem({ spot, index, dayColor, dayId }: DaySpotItemProps) {
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
    </div>
  );
}
