import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useTrip } from '../../hooks/useTrip';
import DayAccordion from './DayAccordion';
import UnassignedSpots from './UnassignedSpots';
import styles from './SidePanel.module.css';

export default function SidePanel() {
  const { trip, addDay, reorderSegments } = useTrip();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which day contains the dragged segment
    for (const day of trip.days) {
      const segmentIds = day.segments.map((s) => s.id);
      const activeIndex = segmentIds.indexOf(active.id as string);
      const overIndex = segmentIds.indexOf(over.id as string);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newOrder = [...segmentIds];
        newOrder.splice(activeIndex, 1);
        newOrder.splice(overIndex, 0, active.id as string);
        reorderSegments(day.id, newOrder);
        break;
      }
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {trip.days.map((day) => (
            <DayAccordion key={day.id} day={day} />
          ))}
        </DndContext>
        <UnassignedSpots />
      </div>
      <button className={styles.addDay} onClick={() => addDay()}>
        + Add Day
      </button>
    </div>
  );
}
