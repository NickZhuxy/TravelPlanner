import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTrip } from '../../hooks/useTrip';
import { useSelection } from '../../hooks/useSelection';
import styles from './UnassignedSpots.module.css';
import type { Spot } from '../../types';

function UnassignedSpotItem({ spot }: { spot: Spot }) {
  const { selectedSpotId, selectSpot } = useSelection();
  const isSelected = selectedSpotId === spot.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: spot.id,
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
      {spot.name}
    </div>
  );
}

export default function UnassignedSpots() {
  const { trip } = useTrip();

  const assignedSpotIds = new Set(trip.days.flatMap((d) => d.spotIds));
  const unassigned = trip.spots.filter((s) => !assignedSpotIds.has(s.id));
  const unassignedIds = unassigned.map((s) => s.id);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'unassigned-drop',
  });

  return (
    <div
      ref={setDropRef}
      className={`${styles.section} ${isOver ? styles.dropTarget : ''}`}
    >
      <div className={styles.header}>Unassigned Spots</div>
      {unassigned.length === 0 ? (
        <div className={styles.empty}>Drop a spot here to unassign it</div>
      ) : (
        <SortableContext id="unassigned-sort" items={unassignedIds} strategy={verticalListSortingStrategy}>
          {unassigned.map((spot) => (
            <UnassignedSpotItem key={spot.id} spot={spot} />
          ))}
        </SortableContext>
      )}
    </div>
  );
}
