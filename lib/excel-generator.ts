import * as XLSX from 'xlsx';
import { Statement } from '@/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(d?: string | Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function applyHeaderStyle(ws: XLSX.WorkSheet, range: string) {
  const ref = XLSX.utils.decode_range(range);
  for (let col = ref.s.c; col <= ref.e.c; col++) {
    const cell = XLSX.utils.encode_cell({ r: ref.s.r, c: col });
    if (!ws[cell]) continue;
    ws[cell].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1a1a1a' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: '444444' } },
      },
    };
  }
}

export function generateMonthlyExcel(
  statements: Statement[],
  month: number,
  year: number
): Buffer {
  const wb = XLSX.utils.book_new();

  // ─── Sheet 1: Summary ───
  const summaryHeaders = [
    'Statement ID', 'Statement Date', 'Vendor Name', 'Vendor Code', 'Industry',
    'Entries', 'Created At', 'Updated At',
  ];
  const summaryData = statements.map((s) => [
    s.statementNumber,
    formatDate(s.statementDate || s.createdAt),
    s.vendorName,
    s.vendorCode,
    s.industryName,
    s.items.length,
    formatDateTime(s.createdAt),
    formatDateTime(s.updatedAt),
  ]);

  const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
  summaryWs['!cols'] = [20, 16, 30, 15, 22, 10, 22, 22].map((w) => ({ wch: w }));
  summaryWs['!freeze'] = { xSplit: 0, ySplit: 1 };
  applyHeaderStyle(summaryWs, `A1:H1`);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // ─── Sheet 2: Entries (S.No, DA No., Closing Stock) ───
  const entriesHeaders = [
    'Statement ID', 'Statement Date', 'S.No.', 'DA No.', 'Closing Stock',
  ];
  const entriesData: (string | number)[][] = [];
  for (const s of statements) {
    for (const item of s.items) {
      entriesData.push([
        s.statementNumber,
        formatDate(s.statementDate || s.createdAt),
        item.serialNumber,
        item.daNumber || '',
        parseFloat(String(item.closingStock)),
      ]);
    }
  }

  const entriesWs = XLSX.utils.aoa_to_sheet([entriesHeaders, ...entriesData]);
  entriesWs['!cols'] = [20, 16, 7, 18, 15].map((w) => ({ wch: w }));
  entriesWs['!freeze'] = { xSplit: 0, ySplit: 1 };
  applyHeaderStyle(entriesWs, `A1:E1`);
  XLSX.utils.book_append_sheet(wb, entriesWs, 'Entries');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}

export function generateYearlyExcel(
  statements: Statement[],
  year: number
): Buffer {
  const wb = XLSX.utils.book_new();

  // ─── Sheet 1: Monthly Summary ───
  const monthlyMap = new Map<number, { count: number; items: number }>();
  for (let m = 1; m <= 12; m++) {
    monthlyMap.set(m, { count: 0, items: 0 });
  }
  for (const s of statements) {
    const entry = monthlyMap.get(s.month)!;
    entry.count += 1;
    entry.items += s.items.length;
  }

  const monthSummaryHeaders = ['Month', 'Statements', 'Total Entries'];
  const monthSummaryData = Array.from(monthlyMap.entries()).map(([m, v]) => [
    MONTHS[m - 1], v.count, v.items,
  ]);

  const monthSummaryWs = XLSX.utils.aoa_to_sheet([monthSummaryHeaders, ...monthSummaryData]);
  monthSummaryWs['!cols'] = [15, 14, 14].map((w) => ({ wch: w }));
  monthSummaryWs['!freeze'] = { xSplit: 0, ySplit: 1 };
  applyHeaderStyle(monthSummaryWs, `A1:C1`);
  XLSX.utils.book_append_sheet(wb, monthSummaryWs, 'Monthly Summary');

  // ─── Sheet 2: All Statements ───
  const stmtHeaders = [
    'Statement ID', 'Statement Date', 'Vendor', 'Vendor Code', 'Month', 'Year',
    'Entries', 'Created At', 'Updated At',
  ];
  const stmtData = statements.map((s) => [
    s.statementNumber,
    formatDate(s.statementDate || s.createdAt),
    s.vendorName,
    s.vendorCode,
    MONTHS[s.month - 1],
    s.year,
    s.items.length,
    formatDateTime(s.createdAt),
    formatDateTime(s.updatedAt),
  ]);

  const stmtWs = XLSX.utils.aoa_to_sheet([stmtHeaders, ...stmtData]);
  stmtWs['!cols'] = [20, 16, 28, 14, 12, 8, 10, 22, 22].map((w) => ({ wch: w }));
  stmtWs['!freeze'] = { xSplit: 0, ySplit: 1 };
  applyHeaderStyle(stmtWs, `A1:I1`);
  XLSX.utils.book_append_sheet(wb, stmtWs, 'All Statements');

  // ─── Sheet 3: All Entries ───
  const allEntriesHeaders = [
    'Statement ID', 'Statement Date', 'Month', 'S.No.', 'DA No.', 'Closing Stock',
  ];
  const allEntriesData: (string | number)[][] = [];
  for (const s of statements) {
    for (const item of s.items) {
      allEntriesData.push([
        s.statementNumber,
        formatDate(s.statementDate || s.createdAt),
        MONTHS[s.month - 1],
        item.serialNumber,
        item.daNumber || '',
        parseFloat(String(item.closingStock)),
      ]);
    }
  }

  const allEntriesWs = XLSX.utils.aoa_to_sheet([allEntriesHeaders, ...allEntriesData]);
  allEntriesWs['!cols'] = [20, 16, 12, 7, 18, 15].map((w) => ({ wch: w }));
  allEntriesWs['!freeze'] = { xSplit: 0, ySplit: 1 };
  applyHeaderStyle(allEntriesWs, `A1:F1`);
  XLSX.utils.book_append_sheet(wb, allEntriesWs, 'All Entries');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}
