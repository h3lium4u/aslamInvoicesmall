export interface StatementItem {
  id: string;
  statementId: string;
  serialNumber: number;
  daNumber: string | null;
  entryDate: string; // ISO date string
  partNumber: string;
  despatches?: string | null;
  openingStock: number;
  closingStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Statement {
  id: string;
  statementNumber: string;
  industryName: string;
  vendorName: string;
  vendorCode: string;
  month: number;
  year: number;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items: StatementItem[];
}

export interface StatementListItem {
  id: string;
  statementNumber: string;
  industryName: string;
  vendorName: string;
  vendorCode: string;
  month: number;
  year: number;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
}

export interface DashboardStats {
  totalEntries: number;
  currentMonthEntries: number;
  currentYearEntries: number;
  lastEntry: string | null; // ISO date string
}

export interface MonthlyReport {
  month: number;
  year: number;
  statementCount: number;
  totalItems: number;
  totalOpeningStock: number;
  totalClosingStock: number;
  vendors: { vendorName: string; vendorCode: string; count: number }[];
}

export interface YearlyReport {
  year: number;
  statementCount: number;
  totalItems: number;
  totalOpeningStock: number;
  totalClosingStock: number;
  monthlyBreakdown: {
    month: number;
    statementCount: number;
    itemCount: number;
    totalOpening: number;
    totalClosing: number;
  }[];
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
