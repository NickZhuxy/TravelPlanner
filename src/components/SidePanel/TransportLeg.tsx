import type { Segment } from '../../types';
import { useTrip } from '../../hooks/useTrip';
import styles from './TransportLeg.module.css';

interface TransportLegProps {
  segment: Segment;
  dayId: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return '<1 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

export default function TransportLeg({ segment, dayId }: TransportLegProps) {
  const { updateSegment } = useTrip();

  const handleModeChange = (mode: 'walk' | 'drive') => {
    if (mode === segment.mode) return;
    updateSegment(dayId, segment.id, {
      mode,
      routeGeometry: null,
      duration: undefined,
      distance: undefined,
    });
  };

  const loading = segment.routeGeometry === null;

  return (
    <div className={styles.leg}>
      <div className={styles.line} />
      <div className={styles.controls}>
        <button
          className={`${styles.modeBtn} ${segment.mode === 'drive' ? styles.active : ''}`}
          onClick={() => handleModeChange('drive')}
          title="Drive"
        >
          D
        </button>
        <button
          className={`${styles.modeBtn} ${segment.mode === 'walk' ? styles.active : ''}`}
          onClick={() => handleModeChange('walk')}
          title="Walk"
        >
          W
        </button>
        <span className={styles.info}>
          {loading
            ? 'Loading...'
            : segment.duration != null && segment.distance != null
              ? `${formatDuration(segment.duration)} · ${formatDistance(segment.distance)}`
              : '—'}
        </span>
      </div>
    </div>
  );
}
