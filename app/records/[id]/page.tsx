'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Statement } from '@/types';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { Toast } from '@/components/ui/Toast';
import styles from './ViewRecord.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatNumber(n: number): string {
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ViewRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function loadStatement() {
      try {
        const res = await fetch(`/api/statements/${id}`);
        if (!res.ok) throw new Error('Statement not found');
        const json = await res.json();
        setStatement(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStatement();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!statement) return;
    setToast({ message: 'Generating PDF document...', type: 'info' });
    try {
      const res = await fetch(`/api/statements/${id}/pdf`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${statement.statementNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ message: 'PDF generated & downloaded successfully.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'PDF failed', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!statement) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/statements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete statement');

      setToast({ message: 'Statement deleted successfully.', type: 'success' });
      setTimeout(() => {
        router.push('/records');
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Delete failed', type: 'error' });
      setIsDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: 32 }}><LoadingState message="Loading statement register..." /></div>;
  if (error || !statement) return <div style={{ padding: 32 }}><ErrorState message={error || 'Statement not found'} /></div>;

  const monthName = MONTHS[statement.month - 1];

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Action Header */}
      <div className={styles.topActions}>
        <Link href="/records" className={styles.backBtn}>
          Back to Records
        </Link>

        <div className={styles.actionButtons}>
          <button onClick={handleDownloadPdf} className={styles.pdfBtn}>
            Download PDF
          </button>
          <Link href={`/records/${id}/edit`} className={styles.editBtn}>
            Edit Statement
          </Link>
          <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
            Delete
          </button>
        </div>
      </div>

      {/* Digital Document View */}
      <div className={styles.documentCard}>
        {/* Document Header */}
        <div className={styles.docHeader}>
          <div className={styles.companyTitle}>{statement.industryName}</div>
          <div className={styles.docSubtitle}>
            STOCK STATEMENT FOR THE MONTH OF {monthName.toUpperCase()} {statement.year}
          </div>
          <div className={styles.headerLine} />
        </div>

        {/* Metadata Grid */}
        <div className={styles.metaGrid}>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Statement ID</span>
            <span className={styles.metaValueBadge}>{statement.statementNumber}</span>
          </div>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Statement Date</span>
            <span className={styles.metaValue}>{formatDate(statement.statementDate || statement.createdAt)}</span>
          </div>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Vendor Code</span>
            <span className={styles.metaValue}>{statement.vendorCode}</span>
          </div>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Vendor Name</span>
            <span className={styles.metaValue}>{statement.vendorName}</span>
          </div>
          <div className={styles.metaBox}>
            <span className={styles.metaLabel}>Period</span>
            <span className={styles.metaValue}>{monthName} {statement.year}</span>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th colSpan={2} style={{ textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '1px' }}>
                  INWARD
                </th>
                <th colSpan={1} style={{ textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa', fontWeight: 700, letterSpacing: '1px' }}>
                  DESPATCHES
                </th>
              </tr>
              <tr>
                <th style={{ width: '80px' }}>S.No.</th>
                <th>DA No.</th>
                <th style={{ textAlign: 'right', width: '220px' }}>Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {statement.items.map((item) => (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.sNoCell}>{item.serialNumber}</td>
                  <td>{item.daNumber || '—'}</td>
                  <td className={styles.numericCell}>{formatNumber(item.closingStock)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Footer */}
        <div className={styles.docFooter}>
          <span>Registered in Western Industries Cloud Database</span>
          <span>Created: {new Date(statement.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        statement={statement}
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
