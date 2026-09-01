'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { StatementListItem } from '@/types';
import { SearchBar } from '@/components/records/SearchBar';
import { FilterPanel } from '@/components/records/FilterPanel';
import { RecordsTable } from '@/components/records/RecordsTable';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { ReceiptPrinterModal } from '@/components/animation/ReceiptPrinterModal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { Toast } from '@/components/ui/Toast';
import styles from './RecordsPage.module.css';

export default function RecordsPage() {
  const [statements, setStatements] = useState<StatementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode tab: 'all' | 'monthly' | 'yearly'
  const [viewMode, setViewMode] = useState<'all' | 'monthly' | 'yearly'>('all');

  // Search & Filter state (sort defaulted to 'recent' for most recent first)
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [vendor, setVendor] = useState('');
  const [sort, setSort] = useState('recent');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<StatementListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchStatements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (month) params.set('month', month);
      if (year) params.set('year', year);
      if (vendor) params.set('vendor', vendor);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/statements?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load statement records');

      const json = await res.json();
      setStatements(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, month, year, vendor, sort]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/statements/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete statement');

      setToast({
        message: `Statement ${deleteTarget.statementNumber} permanently deleted. All reports updated.`,
        type: 'success',
      });

      setDeleteTarget(null);
      fetchStatements();
    } catch (err: any) {
      setToast({
        message: err.message || 'Deletion failed',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Receipt Printer modal state for PDF download animation
  const [printerModalData, setPrinterModalData] = useState<any>(null);
  // Guard: fire download exactly once per modal open
  const pdfDownloadFiredRef = useRef(false);

  const handleDownloadPdf = async (id: string, statementNumber: string) => {
    pdfDownloadFiredRef.current = false; // reset for new modal session
    // Fetch full statement details to feed into animation
    try {
      const res = await fetch(`/api/statements/${id}`);
      if (!res.ok) throw new Error('Could not fetch statement details');
      const json = await res.json();
      setPrinterModalData(json.data);
    } catch (err: any) {
      setToast({ message: err.message || 'Could not prepare PDF animation', type: 'error' });
    }
  };

  const triggerActualPdfDownload = useCallback(async () => {
    if (pdfDownloadFiredRef.current) return;
    pdfDownloadFiredRef.current = true;

    if (!printerModalData?.id) return;
    try {
      const res = await fetch(`/api/statements/${printerModalData.id}/pdf`);
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${printerModalData.statementNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ message: 'PDF downloaded successfully.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Could not download PDF', type: 'error' });
    }
  }, [printerModalData]);

  // Excel export animation state
  const [excelModalData, setExcelModalData] = useState<{
    reportType: 'monthly' | 'yearly';
    month?: number;
    year?: number;
  } | null>(null);

  const handleMonthlyExportClick = () => {
    const targetMonth = parseInt(month || String(new Date().getMonth() + 1), 10);
    const targetYear = parseInt(year || String(new Date().getFullYear()), 10);
    setExcelModalData({
      reportType: 'monthly',
      month: targetMonth,
      year: targetYear,
    });
  };

  const handleYearlyExportClick = () => {
    const targetYear = parseInt(year || String(new Date().getFullYear()), 10);
    setExcelModalData({
      reportType: 'yearly',
      year: targetYear,
    });
  };

  const triggerActualExcelDownload = useCallback(async () => {
    if (!excelModalData) return;
    const { reportType, month: m, year: y } = excelModalData;

    if (reportType === 'monthly') {
      const targetMonth = m || new Date().getMonth() + 1;
      const targetYear = y || new Date().getFullYear();
      try {
        const res = await fetch(`/api/export/monthly?month=${targetMonth}&year=${targetYear}`);
        if (!res.ok) throw new Error('Failed to generate Excel export');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = res.headers.get('content-disposition');
        let filename = `WESTERN_INDUSTRIES_TVS_${targetMonth}_${targetYear}.xlsx`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) filename = match[1];
        }

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setToast({ message: 'Monthly Excel report downloaded.', type: 'success' });
      } catch (err: any) {
        setToast({ message: err.message || 'Export failed', type: 'error' });
      }
    } else if (reportType === 'yearly') {
      const targetYear = y || new Date().getFullYear();
      try {
        const res = await fetch(`/api/export/yearly?year=${targetYear}`);
        if (!res.ok) throw new Error('Failed to generate Excel export');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = res.headers.get('content-disposition');
        let filename = `WESTERN_INDUSTRIES_TVS_${targetYear}.xlsx`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) filename = match[1];
        }

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setToast({ message: 'Yearly Excel report downloaded.', type: 'success' });
      } catch (err: any) {
        setToast({ message: err.message || 'Export failed', type: 'error' });
      }
    }
  }, [excelModalData]);

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>WESTERN INDUSTRIES / RECORDS INTERFACE</span>
          <h1 className={styles.pageTitle}>Stock Statement Records</h1>
          <p className={styles.pageSubtitle}>
            Sorted by most recent entries by default. View, search, edit, delete records, and download monthly or yearly Excel reports.
          </p>
        </div>

        <div className={styles.headerButtons}>
          <button
            type="button"
            onClick={handleMonthlyExportClick}
            className={styles.excelExportBtn}
          >
            Download Monthly Excel
          </button>

          <button
            type="button"
            onClick={handleYearlyExportClick}
            className={styles.excelExportBtn}
          >
            Download Yearly Excel
          </button>

          <Link href="/" className={styles.newEntryBtn}>
            + New Entry
          </Link>
        </div>
      </div>

      {/* Mode View Tabs & Filter Bar */}
      <div className={styles.filterBarCard}>
        <div className={styles.viewTabs}>
          <button
            onClick={() => {
              setViewMode('all');
              setMonth('');
              setYear('');
            }}
            className={`${styles.tabBtn} ${viewMode === 'all' ? styles.tabActive : ''}`}
          >
            All Entries
          </button>
          <button
            onClick={() => {
              setViewMode('monthly');
              if (!month) setMonth(String(new Date().getMonth() + 1));
              if (!year) setYear(String(new Date().getFullYear()));
            }}
            className={`${styles.tabBtn} ${viewMode === 'monthly' ? styles.tabActive : ''}`}
          >
            Monthly View
          </button>
          <button
            onClick={() => {
              setViewMode('yearly');
              setMonth('');
              if (!year) setYear(String(new Date().getFullYear()));
            }}
            className={`${styles.tabBtn} ${viewMode === 'yearly' ? styles.tabActive : ''}`}
          >
            Yearly View
          </button>
        </div>

        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel
          selectedMonth={month}
          selectedYear={year}
          selectedVendor={vendor}
          selectedSort={sort}
          onMonthChange={setMonth}
          onYearChange={setYear}
          onVendorChange={setVendor}
          onSortChange={setSort}
          onReset={() => {
            setSearch('');
            setMonth('');
            setYear('');
            setVendor('');
            setSort('recent');
            setViewMode('all');
          }}
        />
      </div>

      {/* Table Section */}
      {loading && <LoadingState message="Searching database records..." />}
      {error && <ErrorState message={error} onRetry={fetchStatements} />}

      {!loading && !error && statements.length === 0 && (
        <EmptyState
          title="No statements found"
          description="No statements exist in the database. Create a new statement to populate your register."
          action={
            <Link href="/" className={styles.newEntryBtn}>
              + Create New Statement
            </Link>
          }
        />
      )}

      {!loading && !error && statements.length > 0 && (
        <RecordsTable
          statements={statements}
          onDeleteClick={(stmt) => setDeleteTarget(stmt)}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        statement={deleteTarget}
        isOpen={Boolean(deleteTarget)}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Receipt Printer Modal Animation for PDF */}
      <ReceiptPrinterModal
        isOpen={Boolean(printerModalData)}
        reportType="statement"
        statementData={printerModalData}
        onCompleteDownload={triggerActualPdfDownload}
        onClose={() => setPrinterModalData(null)}
      />

      {/* Receipt Printer Modal Animation for Excel Exports */}
      <ReceiptPrinterModal
        isOpen={Boolean(excelModalData)}
        reportType={excelModalData?.reportType || 'monthly'}
        reportData={excelModalData || undefined}
        onCompleteDownload={triggerActualExcelDownload}
        onClose={() => setExcelModalData(null)}
      />
    </div>
  );
}
