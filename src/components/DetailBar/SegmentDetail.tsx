import type { Segment, Day } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import { getSegmentColor, getSegmentWidth, DEFAULT_SEGMENT_WIDTH } from '../../utils/colors';
import styles from './DetailBar.module.css';

interface SegmentDetailProps {
  segment: Segment;
  day: Day;
}

export default function SegmentDetail({ segment, day }: SegmentDetailProps) {
  const { updateSegment, removeSegment } = useTrip();
  const dayId = day.id;

  const effectiveColor = getSegmentColor(segment, day);
  const effectiveWidth = getSegmentWidth(segment);

  return (
    <div className={styles.fields}>
      <label className={styles.field}>
        <span className={styles.label}>Link</span>
        <input
          className={styles.input}
          value={segment.link ?? ''}
          placeholder="https://..."
          onChange={(e) => updateSegment(dayId, segment.id, { link: e.target.value || undefined })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Notes</span>
        <textarea
          className={styles.textarea}
          value={segment.notes ?? ''}
          placeholder="Add notes..."
          rows={2}
          onChange={(e) => updateSegment(dayId, segment.id, { notes: e.target.value || undefined })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Color</span>
        <div className={styles.colorRow}>
          <input
            type="color"
            value={effectiveColor}
            onChange={(e) => updateSegment(dayId, segment.id, { color: e.target.value })}
          />
          {segment.color && (
            <button
              className={styles.resetBtn}
              onClick={() => updateSegment(dayId, segment.id, { color: undefined })}
            >
              Reset to day color
            </button>
          )}
        </div>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Width ({effectiveWidth}px)</span>
        <input
          type="range"
          min="1"
          max="12"
          value={effectiveWidth}
          onChange={(e) => updateSegment(dayId, segment.id, { width: parseInt(e.target.value) })}
        />
        {segment.width && segment.width !== DEFAULT_SEGMENT_WIDTH && (
          <button
            className={styles.resetBtn}
            onClick={() => updateSegment(dayId, segment.id, { width: undefined })}
          >
            Reset width
          </button>
        )}
      </label>
      <button className={styles.deleteBtn} onClick={() => removeSegment(dayId, segment.id)}>
        Remove Segment
      </button>
    </div>
  );
}
