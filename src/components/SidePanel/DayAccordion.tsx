import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Day } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import SegmentItem from './SegmentItem';
import styles from './DayAccordion.module.css';

interface DayAccordionProps {
  day: Day;
}

export default function DayAccordion({ day }: DayAccordionProps) {
  const [expanded, setExpanded] = useState(true);
  const { updateDay, removeDay } = useTrip();
  const [editing, setEditing] = useState(false);

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
          {day.segments.length === 0 ? (
            <div className={styles.empty}>No segments yet</div>
          ) : (
            <SortableContext items={day.segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {day.segments.map((seg) => (
                <SegmentItem key={seg.id} segment={seg} dayId={day.id} color={day.color} />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
