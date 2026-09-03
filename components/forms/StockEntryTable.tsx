'use client';

import { StatementItemInput } from '@/lib/validations';
import { StockEntryRow } from './StockEntryRow';
import styles from './StockEntryTable.module.css';

interface StockEntryTableProps {
  items: StatementItemInput[];
  onChange: (items: StatementItemInput[]) => void;
  errors?: Record<string, string>[];
}

export function StockEntryTable({ items, onChange, errors = [] }: StockEntryTableProps) {
  const handleRowChange = (
    index: number,
    field: keyof StatementItemInput,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([
      ...items,
      {
        daNumber: '',
        openingStock: 0,
        closingStock: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            {/* Top Super-Headers: INWARD (2 cols) and DESPATCHES (1 col) */}
            <tr>
              <th colSpan={2} className={styles.superHeaderInward}>
                INWARD
              </th>
              <th colSpan={1} className={styles.superHeaderDespatches}>
                DESPATCHES
              </th>
              <th rowSpan={2} style={{ width: '90px', textAlign: 'center', verticalAlign: 'middle' }}>
                Action
              </th>
            </tr>
            {/* Sub-Headers */}
            <tr>
              <th style={{ width: '70px' }}>S.No.</th>
              <th>DA No. *</th>
              <th style={{ width: '220px', textAlign: 'right' }}>Closing Stock *</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <StockEntryRow
                key={idx}
                index={idx}
                item={item}
                onChange={handleRowChange}
                onRemove={handleRemoveRow}
                canRemove={items.length > 1}
                errors={errors[idx]}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.tableFooter}>
        <button
          type="button"
          onClick={handleAddRow}
          className={styles.addRowBtn}
        >
          + Add Row
        </button>
        <span className={styles.rowCount}>
          {items.length} {items.length === 1 ? 'row' : 'rows'} total
        </span>
      </div>
    </div>
  );
}
