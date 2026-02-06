import { useRef } from 'react';
import { useTrip } from '../hooks/useTrip';
import { exportTrip, importTrip } from '../services/storage';
import styles from './Toolbar.module.css';

export default function Toolbar() {
  const { trip, setTripName, replaceTrip } = useTrip();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportTrip(trip);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('This will replace your current trip. Continue?')) return;
    try {
      const imported = await importTrip(file);
      replaceTrip(imported);
    } catch {
      alert('Failed to import trip file.');
    }
    e.target.value = '';
  };

  return (
    <div className={styles.toolbar}>
      <input
        className={styles.tripName}
        value={trip.name}
        onChange={(e) => setTripName(e.target.value)}
      />
      <div className={styles.actions}>
        <button onClick={handleExport}>Export</button>
        <button onClick={() => fileInputRef.current?.click()}>Import</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
