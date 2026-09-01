'use client';

import { useState, useEffect } from 'react';
import styles from './Records.module.css';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search by Statement ID, DA No, Part No...',
}: SearchBarProps) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localVal, value, onChange]);

  return (
    <div className={styles.searchWrapper}>
      <input
        type="text"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
      {localVal && (
        <button
          type="button"
          onClick={() => {
            setLocalVal('');
            onChange('');
          }}
          className={styles.clearSearchBtn}
          title="Clear search"
        >
          Clear
        </button>
      )}
    </div>
  );
}
