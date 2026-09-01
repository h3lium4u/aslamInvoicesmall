'use client';

import { useState, useEffect, useCallback } from 'react';
import { MonthlyReport, YearlyReport } from '@/types';
import { ReceiptPrinterModal } from '@/components/animation/ReceiptPrinterModal';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { Toast } from '@/components/ui/Toast';
import styles from './Reports.module.css';

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
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReportsPage() {
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/reports?mode=${mode}&month=${month}&year=${year}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load report data');
      const json = await res.json();

      if (mode === 'monthly') {
        setMonthlyData(json.data);
      } else {
        setYearlyData(json.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Printer animation state for Excel reports
  const [excelModalData, setExcelModalData] = useState<{
    reportType: 'monthly' | 'yearly';
    month?: number;
    year?: number;
  } | null>(null);

  const handleMonthlyExportClick = () => {
    setExcelModalData({ reportType: 'monthly', month, year });
  };

  const handleYearlyExportClick = () => {
    setExcelModalData({ reportType: 'yearly', year });
  };

  const triggerActualExcelDownload = useCallback(async () => {
    if (!excelModalData) return;
    const { reportType, month: m, year: y } = excelModalData;

    if (reportType === 'monthly') {
      try {
        const res = await fetch(`/api/export/monthly?month=${m}&year=${y}`);
        if (!res.ok) throw new Error('Failed to generate monthly Excel report');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = res.headers.get('content-disposition');
        let filename = `WESTERN_INDUSTRIES_TVS_${m}_${y}.xlsx`;
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
    } else {
      try {
        const res = await fetch(`/api/export/yearly?year=${y}`);
        if (!res.ok) throw new Error('Failed to generate yearly Excel report');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = res.headers.get('content-disposition');
        let filename = `WESTERN_INDUSTRIES_TVS_${y}.xlsx`;
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
          <span className={styles.breadcrumb}>WESTERN INDUSTRIES / REPORTS</span>
          <h1 className={styles.pageTitle}>Inventory & Stock Reports</h1>
          <p className={styles.pageSubtitle}>
            Calculated dynamic stock totals, vendor breakdowns, and official .xlsx workbook downloads.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className={styles.modeSwitcher}>
          <button
            onClick={() => setMode('monthly')}
            className={`${styles.modeBtn} ${mode === 'monthly' ? styles.modeActive : ''}`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setMode('yearly')}
            className={`${styles.modeBtn} ${mode === 'yearly' ? styles.modeActive : ''}`}
          >
            Yearly View
          </button>
        </div>
      </div>

      {/* Selector Card */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          {mode === 'monthly' && (
            <div className={styles.field}>
              <label className={styles.label}>Select Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className={styles.select}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Select Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className={styles.select}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {mode === 'monthly' ? (
            <button onClick={handleMonthlyExportClick} className={styles.exportBtn}>
              Download Monthly Excel ({MONTHS[month - 1].label} {year})
            </button>
          ) : (
            <button onClick={handleYearlyExportClick} className={styles.exportBtn}>
              Download Yearly Excel ({year})
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingState message="Calculating report totals..." />}
      {error && <ErrorState message={error} onRetry={fetchReport} />}

      {/* Monthly View Content */}
      {!loading && !error && mode === 'monthly' && monthlyData && (
        <div className={styles.reportContent}>
          {/* Summary Cards */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Statements</span>
              <span className={styles.metricValue}>{monthlyData.statementCount}</span>
              <span className={styles.metricSub}>Statements submitted</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Stock Rows</span>
              <span className={styles.metricValue}>{monthlyData.totalItems}</span>
              <span className={styles.metricSub}>Individual line items</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Raw Opening Stock Sum</span>
              <span className={styles.metricValue}>{formatNumber(monthlyData.totalOpeningStock)}</span>
              <span className={styles.metricSub}>Sum of all opening balances</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Raw Closing Stock Sum</span>
              <span className={styles.metricValue}>{formatNumber(monthlyData.totalClosingStock)}</span>
              <span className={styles.metricSub}>Sum of all closing balances</span>
            </div>
          </div>

          {/* Vendor Breakdown */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Vendor Contribution Breakdown</h3>
            {monthlyData.vendors.length === 0 ? (
              <p className={styles.emptyText}>No statements entered for this period.</p>
            ) : (
              <div className={styles.vendorTableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Vendor Code</th>
                      <th>Vendor Name</th>
                      <th style={{ textAlign: 'right' }}>Statements Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.vendors.map((v) => (
                      <tr key={v.vendorCode}>
                        <td className={styles.vendorCodeTag}>{v.vendorCode}</td>
                        <td style={{ fontWeight: 600 }}>{v.vendorName}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>
                          {v.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yearly View Content */}
      {!loading && !error && mode === 'yearly' && yearlyData && (
        <div className={styles.reportContent}>
          {/* Summary Cards */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Yearly Statements</span>
              <span className={styles.metricValue}>{yearlyData.statementCount}</span>
              <span className={styles.metricSub}>Total in {year}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Yearly Stock Rows</span>
              <span className={styles.metricValue}>{yearlyData.totalItems}</span>
              <span className={styles.metricSub}>Total items registered</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Yearly Opening Stock Sum</span>
              <span className={styles.metricValue}>{formatNumber(yearlyData.totalOpeningStock)}</span>
              <span className={styles.metricSub}>Cumulative opening sum</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Yearly Closing Stock Sum</span>
              <span className={styles.metricValue}>{formatNumber(yearlyData.totalClosingStock)}</span>
              <span className={styles.metricSub}>Cumulative closing sum</span>
            </div>
          </div>

          {/* Monthly Trend Table */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Monthly Statement Breakdown ({year})</h3>
            <div className={styles.vendorTableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'center' }}>Statements</th>
                    <th style={{ textAlign: 'center' }}>Stock Rows</th>
                    <th style={{ textAlign: 'right' }}>Opening Stock Sum</th>
                    <th style={{ textAlign: 'right' }}>Closing Stock Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.monthlyBreakdown.map((m) => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 600 }}>{MONTHS[m.month - 1].label}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{m.statementCount}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{m.itemCount}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumber(m.totalOpening)}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumber(m.totalClosing)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
