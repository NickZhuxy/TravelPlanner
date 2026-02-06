import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { hasSortableData } from '@dnd-kit/sortable';
import { useTrip } from '../../hooks/useTrip';
import DayAccordion from './DayAccordion';
import UnassignedSpots from './UnassignedSpots';
import styles from './SidePanel.module.css';

function parseDayId(containerId: string): string | null {
  if (containerId.startsWith('day-sort:')) return containerId.slice(9);
  if (containerId.startsWith('day-drop:')) return containerId.slice(9);
  return null; // unassigned-sort, unassigned-drop, or unknown
}

export default function SidePanel() {
  const { trip, addDay, moveSpotToDay } = useTrip();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const spotId = active.id as string;

    // Determine source container
    let fromDayId: string | null = null;
    if (hasSortableData(active)) {
      fromDayId = parseDayId(active.data.current.sortable.containerId as string);
    }

    // Determine target container and insert index
    let toDayId: string | null = null;
    let insertIndex = 0;

    if (hasSortableData(over)) {
      toDayId = parseDayId(over.data.current.sortable.containerId as string);
      insertIndex = over.data.current.sortable.index;
    } else {
      // Dropped on a plain droppable (empty day body or unassigned container)
      toDayId = parseDayId(over.id as string);
      if (toDayId) {
        const day = trip.days.find((d) => d.id === toDayId);
        insertIndex = day ? day.spotIds.length : 0;
      }
    }

    // Skip unassigned-to-unassigned (no meaningful change)
    if (fromDayId === null && toDayId === null) return;

    moveSpotToDay(spotId, fromDayId, toDayId, insertIndex);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {trip.days.map((day) => (
            <DayAccordion key={day.id} day={day} />
          ))}
          <UnassignedSpots />
        </DndContext>
      </div>
      <button className={styles.addDay} onClick={() => addDay()}>
        + Add Day
      </button>
    </div>
  );
}
