import { useRef, useState, useEffect } from 'react';
import { useTrip } from '../hooks/useTrip';
import { exportTrip, importTrip } from '../services/storage';
import SettingsPanel from './SettingsPanel';
import styles from './Toolbar.module.css';

function getInitialTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

export default function Toolbar() {
  const { trip, setTripName, replaceTrip } = useTrip();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
        <SettingsPanel />
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '\u2600' : '\u263E'}
        </button>
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
