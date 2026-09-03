import path from 'path';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Statement } from '@/types';

// Register fallback hyphenation callback to prevent hyphenation export failures in Node environments
Font.registerHyphenationCallback((word) => [word]);

const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 46,
    height: 46,
    objectFit: 'contain',
  },
  brandTitleBlock: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    letterSpacing: 1.5,
  },
  subTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerBadgeBlock: {
    alignItems: 'flex-end',
  },
  statementBadge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mainDivider: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    width: '100%',
    marginBottom: 12,
  },
  // Meta box container
  metaContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaBlock: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // Table
  table: {
    width: '100%',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  superHeaderRow: {
    flexDirection: 'row',
  },
  superHeaderInward: {
    width: '60%',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingVertical: 4,
    letterSpacing: 1,
  },
  superHeaderDespatches: {
    width: '40%',
    backgroundColor: '#2563eb',
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingVertical: 4,
    letterSpacing: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#1e293b',
  },
  // Column widths: INWARD (60%) & DESPATCHES (40%)
  colSno: { width: '15%' },
  colDa: { width: '45%' },
  colClose: { width: '40%', textAlign: 'right' },
  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1.5,
    borderTopColor: '#0f172a',
  },
  summaryTextInward: {
    width: '60%',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  summaryTextDespatches: {
    width: '40%',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
    textAlign: 'right',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: '#64748b',
  },
  pageNumber: {
    fontSize: 7.5,
    color: '#64748b',
  },
});

const ROWS_PER_PAGE = 26;

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNumber(n: number | string): string {
  return parseFloat(String(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PDFDocumentProps {
  statement: Statement;
  generatedAt: Date;
}

export function StockStatementDocument({ statement, generatedAt }: PDFDocumentProps) {
  const { items } = statement;
  const monthStr = MONTHS[statement.month - 1];
  const pages: typeof items[] = [];

  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    pages.push(items.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const totalClosing = items.reduce((acc, it) => acc + (Number(it.closingStock) || 0), 0);

  const generatedStr = generatedAt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const stmtDateFormatted = formatDate(statement.statementDate || statement.createdAt);

  return (
    <Document title={`${statement.statementNumber} - Stock Statement`}>
      {pages.map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <Page key={pageIdx} size="A4" style={styles.page}>
            {/* Top Brand Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image src={logoPath} style={styles.logo} />
                <View style={styles.brandTitleBlock}>
                  <Text style={styles.companyName}>{statement.industryName}</Text>
                  <Text style={styles.subTitle}>
                    STOCK STATEMENT FOR THE MONTH OF {monthStr.toUpperCase()} {statement.year}
                  </Text>
                </View>
              </View>
              <View style={styles.headerBadgeBlock}>
                <Text style={styles.statementBadge}>{statement.statementNumber}</Text>
              </View>
            </View>

            <View style={styles.mainDivider} />

            {/* Structured Meta Box (Shown on Page 1) */}
            {pageIdx === 0 && (
              <View style={styles.metaContainer}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Statement Date</Text>
                  <Text style={styles.metaValue}>{stmtDateFormatted}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Vendor Code</Text>
                  <Text style={styles.metaValue}>{statement.vendorCode}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Vendor Name</Text>
                  <Text style={styles.metaValue}>{statement.vendorName}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Period</Text>
                  <Text style={styles.metaValue}>{monthStr} {statement.year}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Total Rows</Text>
                  <Text style={styles.metaValue}>{items.length} Entries</Text>
                </View>
              </View>
            )}

            {/* Main Table */}
            <View style={styles.table}>
              {/* Top Super-Header Row: INWARD (60%) & DESPATCHES (40%) */}
              <View style={styles.superHeaderRow}>
                <Text style={styles.superHeaderInward}>INWARD</Text>
                <Text style={styles.superHeaderDespatches}>DESPATCHES</Text>
              </View>

              {/* Sub-Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.colSno]}>S.No</Text>
                <Text style={[styles.tableHeaderText, styles.colDa]}>DA No.</Text>
                <Text style={[styles.tableHeaderText, styles.colClose]}>Closing Stock</Text>
              </View>

              {/* Data Rows */}
              {pageItems.map((item, idx) => (
                <View
                  key={item.id}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colSno]}>{item.serialNumber}</Text>
                  <Text style={[styles.tableCell, styles.colDa]}>{item.daNumber || '—'}</Text>
                  <Text style={[styles.tableCell, styles.colClose]}>{formatNumber(item.closingStock)}</Text>
                </View>
              ))}

              {/* Total Summary Row on Last Page */}
              {isLastPage && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTextInward}>TOTAL ENTRIES: {items.length}</Text>
                  <Text style={styles.summaryTextDespatches}>
                    TOTAL CLOSING: {formatNumber(totalClosing)}
                  </Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>
                WESTERN INDUSTRIES — OFFICIAL DIGITAL REGISTER | Printed: {generatedStr}
              </Text>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
