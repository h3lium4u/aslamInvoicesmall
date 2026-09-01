'use client';

import Link from 'next/link';
import { StatementListItem } from '@/types';
import styles from './Records.module.css';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(d: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface RecordsTableProps {
  statements: StatementListItem[];
  onDeleteClick: (statement: StatementListItem) => void;
  onDownloadPdf: (id: string, number: string) => void;
}

export function RecordsTable({
  statements,
  onDeleteClick,
  onDownloadPdf,
}: RecordsTableProps) {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Statement ID</th>
              <th>Vendor Name</th>
              <th>Vendor Code</th>
              <th>Month</th>
              <th>Year</th>
              <th style={{ textAlign: 'center' }}>Entries</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s) => {
              const monthStr = MONTHS[s.month - 1] || s.month;
              return (
                <tr key={s.id} className={styles.row}>
                  {/* Statement ID */}
                  <td>
                    <Link
                      href={`/records/${s.id}`}
                      className={styles.statementIdBadge}
                    >
                      {s.statementNumber}
                    </Link>
                  </td>

                  {/* Vendor Name */}
                  <td className={styles.vendorNameCell}>{s.vendorName}</td>

                  {/* Vendor Code */}
                  <td>
                    <span className={styles.vendorCodeTag}>{s.vendorCode}</span>
                  </td>

                  {/* Month */}
                  <td>{monthStr}</td>

                  {/* Year */}
                  <td>{s.year}</td>

                  {/* Entries Count */}
                  <td style={{ textAlign: 'center' }}>
                    <span className={styles.entriesCountTag}>
                      {s._count?.items ?? 0}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className={styles.dateCell}>{formatDate(s.createdAt)}</td>

                  {/* Updated At */}
                  <td className={styles.dateCell}>{formatDate(s.updatedAt)}</td>

                  {/* Actions (Clean Text Buttons, No Emojis) */}
                  <td>
                    <div className={styles.actionsCell}>
                      <Link
                        href={`/records/${s.id}`}
                        className={styles.actionBtn}
                        title="View statement details"
                      >
                        View
                      </Link>

                      <Link
                        href={`/records/${s.id}/edit`}
                        className={styles.actionBtn}
                        title="Edit statement"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => onDownloadPdf(s.id, s.statementNumber)}
                        className={styles.actionBtn}
                        title="Download PDF statement"
                      >
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteClick(s)}
                        className={`${styles.actionBtn} ${styles.deleteActionBtn}`}
                        title="Delete statement"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
