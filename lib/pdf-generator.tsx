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
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
    width: '100%',
    marginBottom: 10,
  },
  thinDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#888888',
    width: '100%',
    marginBottom: 10,
  },
  // Meta row
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  metaBlock: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 7.5,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111111',
  },
  statementBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  // Table
  table: {
    width: '100%',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DDDDDD',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: '#F9F9F9',
  },
  tableCell: {
    fontSize: 8.5,
    color: '#333333',
  },
  // Column widths
  colSno: { width: '6%' },
  colDa: { width: '15%' },
  colDate: { width: '15%' },
  colPart: { width: '28%' },
  colDespatches: { width: '18%' },
  colClose: { width: '18%', textAlign: 'right' },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#AAAAAA',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: '#888888',
  },
  pageNumber: {
    fontSize: 7,
    color: '#888888',
  },
});

const ROWS_PER_PAGE = 28;

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

  const generatedStr = generatedAt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <Document title={`${statement.statementNumber} - Stock Statement`}>
      {pages.map((pageItems, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Image src={logoPath} style={{ width: 42, height: 42, marginBottom: 6 }} />
            <Text style={styles.companyName}>{statement.industryName}</Text>
            <Text style={styles.subTitle}>
              STOCK STATEMENT FOR THE MONTH OF {monthStr.toUpperCase()} {statement.year}
            </Text>
          </View>
          <View style={styles.divider} />

          {/* Meta info */}
          {pageIdx === 0 && (
            <View style={styles.metaContainer}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Statement No.</Text>
                <Text style={[styles.statementBadge]}>{statement.statementNumber}</Text>
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
            </View>
          )}
          {pageIdx === 0 && <View style={styles.thinDivider} />}

          {/* Table */}
          <View style={styles.table}>
            {/* Top Super-Header Row: INWARD (64%) & DESPATCHES (36%) */}
            <View style={{ flexDirection: 'row', marginBottom: 1 }}>
              <Text style={{ width: '64%', backgroundColor: '#10b981', color: '#FFFFFF', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', paddingVertical: 3, letterSpacing: 1 }}>
                INWARD
              </Text>
              <Text style={{ width: '36%', backgroundColor: '#3b82f6', color: '#FFFFFF', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', paddingVertical: 3, letterSpacing: 1 }}>
                DESPATCHES
              </Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colSno]}>S.No</Text>
              <Text style={[styles.tableHeaderText, styles.colDa]}>DA No.</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.colPart]}>Part No.</Text>
              <Text style={[styles.tableHeaderText, styles.colDespatches]}>Despatches</Text>
              <Text style={[styles.tableHeaderText, styles.colClose]}>Closing Stock</Text>
            </View>

            {pageItems.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colSno]}>{item.serialNumber}</Text>
                <Text style={[styles.tableCell, styles.colDa]}>{item.daNumber || '—'}</Text>
                <Text style={[styles.tableCell, styles.colDate]}>{formatDate(item.entryDate)}</Text>
                <Text style={[styles.tableCell, styles.colPart]}>{item.partNumber}</Text>
                <Text style={[styles.tableCell, styles.colDespatches]}>{item.despatches || '—'}</Text>
                <Text style={[styles.tableCell, styles.colClose]}>{formatNumber(item.closingStock)}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Generated on {generatedStr}</Text>
            <Text style={styles.footerText}>{statement.industryName} — {statement.statementNumber}</Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        </Page>
      ))}
    </Document>
  );
}
