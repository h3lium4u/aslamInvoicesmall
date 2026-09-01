'use client';

import styles from './Records.module.css';

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 7 }, (_, i) => {
    const y = currentYear - 3 + i;
    return { value: String(y), label: String(y) };
  }),
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Sort: Most Recent First' },
  { value: 'oldest', label: 'Sort: Oldest First' },
  { value: 'updated', label: 'Sort: Recently Updated' },
  { value: 'statement_num', label: 'Sort: Statement ID' },
];

interface FilterPanelProps {
  selectedMonth: string;
  selectedYear: string;
  selectedVendor: string;
  selectedSort: string;
  onMonthChange: (m: string) => void;
  onYearChange: (y: string) => void;
  onVendorChange: (v: string) => void;
  onSortChange: (s: string) => void;
  onReset: () => void;
}

export function FilterPanel({
  selectedMonth,
  selectedYear,
  selectedVendor,
  selectedSort,
  onMonthChange,
  onYearChange,
  onVendorChange,
  onSortChange,
  onReset,
}: FilterPanelProps) {
  const isFiltered = Boolean(
    selectedMonth || selectedYear || selectedVendor || selectedSort !== 'recent'
  );

  return (
    <div className={styles.filterGroup}>
      {/* Sort Selector (Default: Most Recent First) */}
      <select
        value={selectedSort}
        onChange={(e) => onSortChange(e.target.value)}
        className={styles.filterSelect}
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Month Filter */}
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className={styles.filterSelect}
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Year Filter */}
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className={styles.filterSelect}
      >
        {YEARS.map((y) => (
          <option key={y.value} value={y.value}>
            {y.label}
          </option>
        ))}
      </select>

      {/* Vendor Code Filter */}
      <input
        type="text"
        value={selectedVendor}
        onChange={(e) => onVendorChange(e.target.value)}
        placeholder="Filter by Vendor Code"
        className={styles.filterInput}
      />

      {/* Reset button */}
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className={styles.resetFilterBtn}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
