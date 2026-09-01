'use client';

import { useState, useEffect, useRef } from 'react';
import { ReceiptPrinter, ReceiptPrinterStage } from './ReceiptPrinter';
import styles from './ReceiptPrinterModal.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface ReceiptPrinterModalProps {
  isOpen: boolean;
  reportType?: 'statement' | 'monthly' | 'yearly';
  statementData?: {
    statementNumber?: string;
    industryName?: string;
    vendorCode?: string;
    vendorName?: string;
    month?: number;
    year?: number;
    items?: {
      serialNumber?: number;
      daNumber?: string | null;
      entryDate?: string;
      partNumber?: string;
      despatches?: string | null;
      closingStock?: number;
    }[];
  } | null;
  reportData?: {
    month?: number;
    year?: number;
    statementCount?: number;
    totalItems?: number;
  } | null;
  onCompleteDownload: () => void;
  onClose: () => void;
}

export function ReceiptPrinterModal({
  isOpen,
  reportType = 'statement',
  statementData,
  reportData,
  onCompleteDownload,
  onClose,
}: ReceiptPrinterModalProps) {
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing');

  const onCompleteRef = useRef(onCompleteDownload);
  useEffect(() => {
    onCompleteRef.current = onCompleteDownload;
  }, [onCompleteDownload]);

  const downloadFiredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setStage('processing');
      downloadFiredRef.current = false;
      return;
    }

    downloadFiredRef.current = false;

    const timer1 = setTimeout(() => {
      setStage('printing');
    }, 700);

    const timer2 = setTimeout(() => {
      setStage('complete');
      if (!downloadFiredRef.current) {
        downloadFiredRef.current = true;
        onCompleteRef.current();
      }
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const monthName =
    reportType === 'monthly' && reportData?.month
      ? MONTHS[reportData.month - 1]
      : statementData?.month
      ? MONTHS[statementData.month - 1]
      : 'CURRENT';

  const yearNum = reportData?.year || statementData?.year || new Date().getFullYear();
  const items = statementData?.items || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            {reportType === 'monthly' && 'PRINTING MONTHLY EXCEL'}
            {reportType === 'yearly' && 'PRINTING YEARLY EXCEL'}
            {reportType === 'statement' && 'PRINTING REGISTER RECEIPT'}
          </span>
          <button onClick={onClose} className={styles.closeBtn}>
            Close ✕
          </button>
        </div>

        <ReceiptPrinter.Root stage={stage} className={styles.printerRoot}>
          <ReceiptPrinter.Machine>
            <ReceiptPrinter.Header>
              <ReceiptPrinter.Screen className={styles.screenFull}>
                <ReceiptPrinter.Status>
                  {stage === 'processing' &&
                    (reportType === 'monthly'
                      ? 'Generating Monthly Excel...'
                      : reportType === 'yearly'
                      ? 'Generating Yearly Excel...'
                      : 'Processing stock statement...')}
                  {stage === 'printing' &&
                    (reportType === 'monthly'
                      ? 'Printing Monthly Report...'
                      : reportType === 'yearly'
                      ? 'Printing Yearly Report...'
                      : 'Printing receipt...')}
                  {stage === 'complete' &&
                    (reportType === 'monthly'
                      ? 'Monthly Excel Ready'
                      : reportType === 'yearly'
                      ? 'Yearly Excel Ready'
                      : 'PDF ready for download')}
                </ReceiptPrinter.Status>
              </ReceiptPrinter.Screen>
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Output>
              <ReceiptPrinter.Paper>
                {/* Header */}
                <div className={styles.receiptHeader}>
                  <span className={styles.receiptCompany}>WESTERN INDUSTRIES</span>
                  <span className={styles.receiptTitle}>
                    {reportType === 'monthly' && 'MONTHLY STOCK REGISTER EXCEL'}
                    {reportType === 'yearly' && 'YEARLY STOCK REGISTER EXCEL'}
                    {reportType === 'statement' && 'STOCK STATEMENT REGISTER'}
                  </span>
                  <span className={styles.receiptPeriod}>
                    PERIOD: {reportType === 'yearly' ? `FULL YEAR ${yearNum}` : `${monthName.toUpperCase()} ${yearNum}`}
                  </span>
                </div>

                {/* Details */}
                <div className={styles.receiptSection}>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>COMPANY</span>
                    <span className={styles.receiptValueBold}>WESTERN INDUSTRIES</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>VENDOR CODE</span>
                    <span className={styles.receiptValue}>32210</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>VENDOR NAME</span>
                    <span className={styles.receiptValueBold}>TVS</span>
                  </div>
                </div>

                {/* Items or Summary section */}
                {reportType === 'statement' ? (
                  <div className={styles.receiptItemsSection}>
                    <div className="flex justify-between text-[8px] font-bold text-emerald-700 border-b border-neutral-300 pb-0.5 mb-1">
                      <span>[INWARD: S.NO / DA / PART]</span>
                      <span>[DESPATCHES]</span>
                    </div>
                    <div className={styles.receiptItemHeader}>
                      <span className={styles.colSNo}>S.NO</span>
                      <span className={styles.colDa}>DA NO</span>
                      <span className={styles.colPart}>PART NO</span>
                      <span className={styles.colClosing}>CLOSING</span>
                    </div>

                    {items.length === 0 ? (
                      <div className={styles.receiptNoItems}>No items</div>
                    ) : (
                      items.map((item, idx) => (
                        <div key={idx} className={styles.receiptItemRow}>
                          <span className={styles.colSNo}>{idx + 1}</span>
                          <span className={styles.colDa}>{item.daNumber || '—'}</span>
                          <span className={styles.colPart}>{item.partNumber || '—'}</span>
                          <span className={styles.colClosing}>{item.closingStock ?? 0}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className={styles.receiptSection}>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>EXPORT FORMAT</span>
                      <span className={styles.receiptValueBold}>MICROSOFT EXCEL (.XLSX)</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>PERIOD</span>
                      <span className={styles.receiptValue}>
                        {reportType === 'yearly' ? `Year ${yearNum}` : `${monthName} ${yearNum}`}
                      </span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>STATUS</span>
                      <span className={styles.receiptValueBold}>VERIFIED DATABASE EXPORT</span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className={styles.receiptFooter}>
                  <span>DIGITAL ARCHIVE CERTIFIED</span>
                  <span className={styles.receiptTimestamp}>
                    {new Date().toLocaleString('en-IN')}
                  </span>
                </div>
              </ReceiptPrinter.Paper>
            </ReceiptPrinter.Output>
          </ReceiptPrinter.Machine>
        </ReceiptPrinter.Root>

        {stage === 'complete' && (
          <div className={styles.modalFooter}>
            <span className={styles.successText}>
              {reportType === 'statement' ? '✓ PDF Downloaded' : '✓ Excel Report Downloaded'}
            </span>
            <button onClick={onClose} className={styles.doneBtn}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
