import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Day, Segment } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import DaySpotItem from './DaySpotItem';
import TransportLeg from './TransportLeg';
import styles from './DayAccordion.module.css';

interface DayAccordionProps {
  day: Day;
}

export default function DayAccordion({ day }: DayAccordionProps) {
  const [expanded, setExpanded] = useState(true);
  const { trip, updateDay, removeDay } = useTrip();
  const [editing, setEditing] = useState(false);

  // Build segment lookup by "fromId:toId"
  const segmentMap = new Map<string, Segment>();
  for (const seg of day.segments) {
    segmentMap.set(`${seg.fromSpotId}:${seg.toSpotId}`, seg);
  }

  // Resolve spots from spotIds
  const spotMap = new Map(trip.spots.map((s) => [s.id, s]));
  const effectiveStayId = day.staySpotId ?? day.spotIds[day.spotIds.length - 1];

  return (
    <div className={styles.accordion}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.colorDot} style={{ background: day.color }} />
        {editing ? (
          <input
            className={styles.labelInput}
            value={day.label}
            onChange={(e) => updateDay(day.id, { label: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className={styles.label}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {day.label}
          </span>
        )}
        <span className={styles.count}>{day.spotIds.length}</span>
        <span className={styles.chevron}>{expanded ? '\u25BE' : '\u25B8'}</span>
        <button
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove ${day.label}?`)) removeDay(day.id);
          }}
        >
          &times;
        </button>
      </div>
      {expanded && (
        <div className={styles.body}>
          {day.spotIds.length === 0 ? (
            <div className={styles.empty}>No spots yet — add from search or map</div>
          ) : (
            <SortableContext items={day.spotIds} strategy={verticalListSortingStrategy}>
              {day.spotIds.map((spotId, idx) => {
                const spot = spotMap.get(spotId);
                if (!spot) return null;

                const elements = [
                  <DaySpotItem
                    key={spotId}
                    spot={spot}
                    index={idx}
                    dayColor={day.color}
                    dayId={day.id}
                    isStay={spot.id === effectiveStayId}
                  />,
                ];

                // Add transport leg between consecutive spots
                if (idx < day.spotIds.length - 1) {
                  const nextSpotId = day.spotIds[idx + 1];
                  const seg = segmentMap.get(`${spotId}:${nextSpotId}`);
                  if (seg) {
                    elements.push(
                      <TransportLeg key={`leg-${seg.id}`} segment={seg} dayId={day.id} />
                    );
                  }
                }

                return elements;
              })}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
