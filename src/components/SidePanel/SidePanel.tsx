import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
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

function DeleteDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'delete-drop' });
  return (
    <div
      ref={setNodeRef}
      className={`${styles.deleteZone} ${isOver ? styles.deleteZoneOver : ''}`}
    >
      Drop here to delete
    </div>
  );
}

export default function SidePanel() {
  const { trip, addDay, moveSpotToDay, removeSpot } = useTrip();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Collapse/expand state — all days start expanded
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(trip.days.map((d) => d.id))
  );

  // Sync: auto-expand newly added days
  useEffect(() => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      for (const day of trip.days) {
        if (!prev.has(day.id)) next.add(day.id);
      }
      // Remove deleted day IDs
      for (const id of prev) {
        if (!trip.days.some((d) => d.id === id)) next.delete(id);
      }
      return next;
    });
  }, [trip.days]);

  const allExpanded = trip.days.length > 0 && expandedDayIds.size === trip.days.length;

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedDayIds(new Set());
    } else {
      setExpandedDayIds(new Set(trip.days.map((d) => d.id)));
    }
  };

  const toggleDay = useCallback((dayId: string) => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const spotId = active.id as string;

    // Check for delete drop zone
    if (over.id === 'delete-drop') {
      removeSpot(spotId);
      return;
    }

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
      {trip.days.length > 0 && (
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Itinerary</span>
          <button className={styles.toggleBtn} onClick={toggleAll}>
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      )}
      <div className={styles.content}>
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {trip.days.map((day) => (
            <DayAccordion
              key={day.id}
              day={day}
              expanded={expandedDayIds.has(day.id)}
              onToggle={() => toggleDay(day.id)}
            />
          ))}
          <UnassignedSpots />
          {activeDragId && <DeleteDropZone />}
        </DndContext>
      </div>
      <button className={styles.addDay} onClick={() => addDay()}>
        + Add Day
      </button>
    </div>
  );
}
