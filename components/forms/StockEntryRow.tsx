'use client';

import { StatementItemInput } from '@/lib/validations';
import styles from './StockEntryTable.module.css';

interface StockEntryRowProps {
  index: number;
  item: StatementItemInput;
  onChange: (index: number, field: keyof StatementItemInput, value: string | number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  errors?: Record<string, string>;
}

export function StockEntryRow({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
  errors = {},
}: StockEntryRowProps) {
  // Extract DA suffix after "DA-" if present
  const fullDa = item.daNumber || '';
  const daSuffix = fullDa.startsWith('DA-') ? fullDa.substring(3) : fullDa;

  const handleDaSuffixChange = (val: string) => {
    // Strip any accidental leading "DA-" if user pastes it
    const cleanVal = val.replace(/^DA-?/i, '');
    const newDaNumber = cleanVal ? `DA-${cleanVal}` : '';
    onChange(index, 'daNumber', newDaNumber);
  };

  return (
    <tr className={styles.row}>
      {/* S.No */}
      <td className={styles.sNoCell}>{index + 1}</td>

      {/* DA No. (Fixed "DA-" prefix + editable suffix with transparent "001" placeholder) */}
      <td>
        <div className={styles.daInputWrapper}>
          <span className={styles.daPrefix}>DA-</span>
          <input
            type="text"
            value={daSuffix}
            onChange={(e) => handleDaSuffixChange(e.target.value)}
            placeholder="001"
            className={styles.daInput}
          />
        </div>
      </td>

      {/* Closing Stock */}
      <td>
        <input
          type="number"
          step="any"
          min="0"
          value={item.closingStock === 0 && !item.closingStock ? '' : item.closingStock}
          onChange={(e) =>
            onChange(index, 'closingStock', e.target.value === '' ? 0 : parseFloat(e.target.value))
          }
          placeholder="0"
          className={`${styles.input} ${styles.numericInput} ${
            errors.closingStock ? styles.inputError : ''
          }`}
        />
      </td>

      {/* Actions */}
      <td className={styles.actionCell}>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className={styles.removeBtn}
          title="Remove row"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
