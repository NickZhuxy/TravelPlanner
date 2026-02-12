import { useState, useRef, useEffect } from 'react';
import { useSettings, type MapProvider } from '../hooks/useSettings';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
  const { mapProvider, googleApiKey, setMapProvider, setGoogleApiKey } = useSettings();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const canUseGoogle = googleApiKey.trim().length > 0;

  const handleProviderChange = (provider: MapProvider) => {
    if (provider === 'google' && !canUseGoogle) return;
    setMapProvider(provider);
  };

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        title="Map provider settings"
      >
        &#9881;
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.section}>
            <span className={styles.label}>Map Provider</span>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${mapProvider === 'free' ? styles.active : ''}`}
                onClick={() => handleProviderChange('free')}
              >
                Free (OSM)
              </button>
              <button
                className={`${styles.toggleBtn} ${mapProvider === 'google' ? styles.active : ''} ${!canUseGoogle ? styles.disabled : ''}`}
                onClick={() => handleProviderChange('google')}
                disabled={!canUseGoogle}
                title={!canUseGoogle ? 'Enter a Google API key first' : ''}
              >
                Google Maps
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.label}>Google API Key</span>
            <input
              type="password"
              className={styles.keyInput}
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
            <a
              className={styles.helpLink}
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get a key from Google Cloud Console
            </a>
            <span className={styles.note}>
              Requires Places API, Routes API, and Map Tiles API enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
