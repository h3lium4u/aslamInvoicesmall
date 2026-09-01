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
    const today = new Date().toISOString().split('T')[0];
    const lastItem = items[items.length - 1];
    onChange([
      ...items,
      {
        daNumber: '',
        entryDate: lastItem ? lastItem.entryDate : today,
        partNumber: '',
        despatches: '',
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
            <tr>
              <th style={{ width: '50px' }}>S.No.</th>
              <th style={{ width: '180px' }}>DA No. *</th>
              <th style={{ width: '145px' }}>Date *</th>
              <th style={{ width: '160px' }}>Part No. *</th>
              <th style={{ width: '180px' }}>Despatches</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Closing Stock *</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
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
