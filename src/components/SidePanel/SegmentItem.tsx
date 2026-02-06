import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Segment } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import { useSelection } from '../../hooks/useSelection';
import styles from './SegmentItem.module.css';

interface SegmentItemProps {
  segment: Segment;
  dayId: string;
  color: string;
}

export default function SegmentItem({ segment, dayId, color }: SegmentItemProps) {
  const { trip } = useTrip();
  const { selectedSegmentId, selectSegment } = useSelection();
  const isSelected = selectedSegmentId === segment.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: segment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const from = trip.spots.find((s) => s.id === segment.fromSpotId);
  const to = trip.spots.find((s) => s.id === segment.toSpotId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={() => selectSegment(segment.id, dayId)}
      {...attributes}
      {...listeners}
    >
      <span className={styles.colorDot} style={{ background: segment.color ?? color }} />
      <span className={styles.label}>
        {from?.name ?? '?'} &rarr; {to?.name ?? '?'}
      </span>
    </div>
  );
}
