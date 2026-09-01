'use client';

import { StatementListItem, Statement } from '@/types';
import styles from './DeleteConfirmationModal.module.css';

interface DeleteConfirmationModalProps {
  statement: StatementListItem | Statement | null;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateTime(d: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function DeleteConfirmationModal({
  statement,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  if (!isOpen || !statement) return null;

  const monthName = MONTHS[statement.month - 1] || statement.month;
  const itemCount =
    'items' in statement
      ? statement.items.length
      : statement._count?.items ?? 0;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.modal} animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>
              Delete Statement {statement.statementNumber}?
            </h3>
            <p className={styles.subtitle}>
              This action cannot be undone. The statement and all stock rows will be permanently deleted from the database and Vercel Blob storage, updating all future Monthly and Yearly Excel reports.
            </p>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Statement ID</span>
            <span className={styles.detailValueBadge}>
              {statement.statementNumber}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Vendor</span>
            <span className={styles.detailValue}>
              {statement.vendorName} ({statement.vendorCode})
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Period</span>
            <span className={styles.detailValue}>
              {monthName} {statement.year}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Entries</span>
            <span className={styles.detailValue}>{itemCount} rows</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Created</span>
            <span className={styles.detailValue}>
              {formatDateTime(statement.createdAt)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Last Updated</span>
            <span className={styles.detailValue}>
              {formatDateTime(statement.updatedAt)}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
