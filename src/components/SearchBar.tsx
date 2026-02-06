import { useSearch } from '../hooks/useSearch';
import type { SearchResult } from '../types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
}

export default function SearchBar({ onResultSelect }: SearchBarProps) {
  const { query, results, loading, search, clearSearch } = useSearch();

  const handleSelect = (result: SearchResult) => {
    onResultSelect(result);
    clearSearch();
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search places..."
          value={query}
          onChange={(e) => search(e.target.value)}
        />
        {loading && <span className={styles.spinner} />}
        {query && !loading && (
          <button className={styles.clear} onClick={clearSearch}>✕</button>
        )}
      </div>
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((r, i) => (
            <li key={i} className={styles.resultItem} onClick={() => handleSelect(r)}>
              <span className={styles.resultName}>{r.name}</span>
              <span className={styles.resultDetail}>{r.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
