'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CreateStatementInput, StatementItemInput } from '@/lib/validations';
import { Statement } from '@/types';
import { StockEntryTable } from './StockEntryTable';
import { Toast } from '@/components/ui/Toast';
import { ReceiptPrinterModal } from '@/components/animation/ReceiptPrinterModal';
import styles from './StatementForm.module.css';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

// Helper to check if a row has any user-entered content (DA No or Closing Stock)
function isRowFilled(item: StatementItemInput): boolean {
  const da = (item.daNumber || '').replace(/^DA-?/i, '').trim();
  const closing = Number(item.closingStock) || 0;

  return Boolean(da || closing > 0);
}

interface StatementFormProps {
  initialData?: Statement;
  isEditing?: boolean;
}

export function StatementForm({ initialData, isEditing = false }: StatementFormProps) {
  const router = useRouter();
  const todayStr = new Date().toISOString().split('T')[0];

  // Fixed metadata fields as requested
  const industryName = 'WESTERN INDUSTRIES';
  const vendorCode = '32210';
  const vendorName = 'TVS';

  const [month, setMonth] = useState<number>(
    initialData?.month || new Date().getMonth() + 1
  );
  const [year, setYear] = useState<number>(
    initialData?.year || new Date().getFullYear()
  );
  const [statementDate, setStatementDate] = useState<string>(
    initialData?.statementDate
      ? new Date(initialData.statementDate).toISOString().split('T')[0]
      : todayStr
  );

  // Initialize with 10 rows by default if creating a new entry
  const [items, setItems] = useState<StatementItemInput[]>(
    initialData?.items
      ? initialData.items.map((it) => ({
          daNumber: it.daNumber || '',
          openingStock: Number(it.openingStock),
          closingStock: Number(it.closingStock),
        }))
      : Array.from({ length: 10 }, () => ({
          daNumber: '',
          openingStock: 0,
          closingStock: 0,
        }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Unsaved changes tracking
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validate = (): boolean => {
    const filledItems = items.filter(isRowFilled);

    if (filledItems.length === 0) {
      setToast({
        message: 'Please fill in at least one stock entry before saving.',
        type: 'error',
      });
      return false;
    }

    const rErrors: Record<string, string>[] = [];
    let hasRowError = false;

    items.forEach((item) => {
      const rErr: Record<string, string> = {};

      // Only validate row if it has content
      if (isRowFilled(item)) {
        if (isNaN(item.closingStock) || item.closingStock < 0)
          rErr.closingStock = 'Invalid stock number';
      }

      rErrors.push(rErr);
      if (Object.keys(rErr).length > 0) hasRowError = true;
    });

    setRowErrors(rErrors);

    if (hasRowError) {
      setToast({
        message: 'Please resolve highlighted errors in your filled stock rows.',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const saveStatement = async (forceCreate = false): Promise<Statement | null> => {
    if (!validate()) return null;

    setIsSubmitting(true);

    // Filter out completely blank/empty rows before sending to backend DB/Excel/PDF
    const filledItems = items.filter(isRowFilled);

    const payload: CreateStatementInput & { forceCreate?: boolean } = {
      industryName,
      vendorCode,
      vendorName,
      month,
      year,
      statementDate,
      items: filledItems.map((it) => ({
        ...it,
        daNumber: it.daNumber?.trim() || undefined,
        entryDate: statementDate,
        partNumber: '',
        openingStock: Number(it.openingStock) || 0,
        closingStock: Number(it.closingStock),
      })),
      forceCreate,
    };

    try {
      const url = isEditing ? `/api/statements/${initialData?.id}` : '/api/statements';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save statement');
      }

      setIsDirty(false);
      setToast({
        message: isEditing ? 'Statement updated successfully.' : 'Statement saved successfully.',
        type: 'success',
      });

      return data.data as Statement;
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Something went wrong.', type: 'error' });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveStatement();
    if (saved) {
      setTimeout(() => {
        router.push('/records');
      }, 1000);
    }
  };

  // Printer animation modal state
  const [printerModalData, setPrinterModalData] = useState<any>(null);
  const pdfDownloadFiredRef = useRef(false);

  const handleSaveAndPdf = async () => {
    setIsDownloadingPdf(true);
    const saved = await saveStatement();
    if (saved) {
      pdfDownloadFiredRef.current = false;
      setPrinterModalData({
        statementId: saved.id,
        statementNumber: saved.statementNumber,
        industryName: saved.industryName,
        vendorCode: saved.vendorCode,
        vendorName: saved.vendorName,
        month: saved.month,
        year: saved.year,
        statementDate: saved.statementDate || statementDate,
        items: saved.items,
      });
    } else {
      setIsDownloadingPdf(false);
    }
  };

  const triggerActualPdfDownload = useCallback(async () => {
    if (pdfDownloadFiredRef.current) return;
    pdfDownloadFiredRef.current = true;

    if (!printerModalData?.statementId) return;
    try {
      const res = await fetch(`/api/statements/${printerModalData.statementId}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${printerModalData.statementNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ message: 'PDF generated & downloaded successfully.', type: 'success' });
    } catch (err: any) {
      setToast({
        message: 'PDF generation failed. Your statement has not been lost.',
        type: 'error',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [printerModalData]);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Info Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.jpg"
              alt="Western Industries Logo"
              style={{
                width: '30px',
                height: '30px',
                objectFit: 'contain',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                padding: '2px',
              }}
            />
            <h2 className={styles.sectionTitle}>Header Information</h2>
          </div>
          <span className={styles.sectionBadge}>STATEMENT METADATA</span>
        </div>

        <div className={styles.grid}>
          {/* Industry Name (Read Only) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Industry Name</label>
            <input
              type="text"
              value={industryName}
              readOnly
              className={`${styles.input} ${styles.readOnlyInput}`}
            />
          </div>

          {/* Vendor Code (Read Only) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Vendor Code</label>
            <input
              type="text"
              value={vendorCode}
              readOnly
              className={`${styles.input} ${styles.readOnlyInput}`}
            />
          </div>

          {/* Vendor Name (Fixed Default: TVS, Read Only) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              readOnly
              className={`${styles.input} ${styles.readOnlyInput}`}
            />
          </div>

          {/* Date Picker (Header Level) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Statement Date *</label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => {
                setStatementDate(e.target.value);
                setIsDirty(true);
              }}
              className={styles.input}
              style={{ colorScheme: 'light' }}
            />
          </div>

          {/* Month (Selectable) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Month *</label>
            <select
              value={month}
              onChange={(e) => {
                setMonth(parseInt(e.target.value, 10));
                setIsDirty(true);
              }}
              className={styles.input}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year (Selectable) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Year *</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(parseInt(e.target.value, 10));
                setIsDirty(true);
              }}
              className={styles.input}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Entry Table Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Stock Entry Table</h2>
          <span className={styles.sectionBadge}>INWARD (DA NO) & DESPATCHES (CLOSING STOCK)</span>
        </div>

        <StockEntryTable
          items={items}
          onChange={(newItems) => {
            setItems(newItems);
            setIsDirty(true);
          }}
          errors={rowErrors}
        />
      </div>

      {/* Action Footer */}
      <div className={styles.actionFooter}>
        <button
          type="button"
          onClick={() => router.push('/records')}
          className={styles.cancelBtn}
        >
          Cancel
        </button>

        <div className={styles.rightActions}>
          <button
            type="submit"
            disabled={isSubmitting || isDownloadingPdf}
            className={styles.saveBtn}
          >
            {isSubmitting ? 'Saving...' : 'Save Statement'}
          </button>

          <button
            type="button"
            onClick={handleSaveAndPdf}
            disabled={isSubmitting || isDownloadingPdf}
            className={styles.savePdfBtn}
          >
            {isDownloadingPdf ? 'Generating PDF...' : 'Save & Download PDF'}
          </button>
        </div>
      </div>

      {/* Animated Receipt Printer Modal */}
      <ReceiptPrinterModal
        isOpen={Boolean(printerModalData)}
        statementData={printerModalData}
        onCompleteDownload={triggerActualPdfDownload}
        onClose={() => {
          setPrinterModalData(null);
          router.push('/records');
        }}
      />
    </form>
  );
}
