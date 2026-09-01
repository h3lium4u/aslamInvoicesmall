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

      {/* Date */}
      <td>
        <input
          type="date"
          value={item.entryDate ? item.entryDate.substring(0, 10) : ''}
          onChange={(e) => onChange(index, 'entryDate', e.target.value)}
          className={`${styles.input} ${errors.entryDate ? styles.inputError : ''}`}
        />
      </td>

      {/* Part No. */}
      <td>
        <input
          type="text"
          value={item.partNumber}
          onChange={(e) => onChange(index, 'partNumber', e.target.value)}
          placeholder="WI-PART-100"
          className={`${styles.input} ${errors.partNumber ? styles.inputError : ''}`}
        />
      </td>

      {/* Despatches (Optional text/number right above Closing Stock) */}
      <td>
        <input
          type="text"
          value={item.despatches || ''}
          onChange={(e) => onChange(index, 'despatches', e.target.value)}
          placeholder="Optional despatches"
          className={styles.input}
        />
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
