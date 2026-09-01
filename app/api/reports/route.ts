import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'monthly'; // 'monthly' | 'yearly'
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (mode === 'monthly') {
      const statements = await prisma.statement.findMany({
        where: { month, year },
        include: { items: true },
      });

      let totalItems = 0;
      let totalOpeningStock = 0;
      let totalClosingStock = 0;
      const vendorMap = new Map<string, { vendorName: string; vendorCode: string; count: number }>();

      for (const s of statements) {
        totalItems += s.items.length;
        for (const item of s.items) {
          totalOpeningStock += Number(item.openingStock);
          totalClosingStock += Number(item.closingStock);
        }

        const key = s.vendorCode;
        if (!vendorMap.has(key)) {
          vendorMap.set(key, { vendorName: s.vendorName, vendorCode: s.vendorCode, count: 1 });
        } else {
          vendorMap.get(key)!.count += 1;
        }
      }

      return NextResponse.json({
        data: {
          month,
          year,
          statementCount: statements.length,
          totalItems,
          totalOpeningStock,
          totalClosingStock,
          vendors: Array.from(vendorMap.values()),
        },
      });
    } else {
      // Yearly report
      const statements = await prisma.statement.findMany({
        where: { year },
        include: { items: true },
      });

      let totalItems = 0;
      let totalOpeningStock = 0;
      let totalClosingStock = 0;

      const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        statementCount: 0,
        itemCount: 0,
        totalOpening: 0,
        totalClosing: 0,
      }));

      for (const s of statements) {
        totalItems += s.items.length;
        const mIdx = s.month - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthlyBreakdown[mIdx].statementCount += 1;
          monthlyBreakdown[mIdx].itemCount += s.items.length;
        }

        for (const item of s.items) {
          const op = Number(item.openingStock);
          const cl = Number(item.closingStock);
          totalOpeningStock += op;
          totalClosingStock += cl;
          if (mIdx >= 0 && mIdx < 12) {
            monthlyBreakdown[mIdx].totalOpening += op;
            monthlyBreakdown[mIdx].totalClosing += cl;
          }
        }
      }

      return NextResponse.json({
        data: {
          year,
          statementCount: statements.length,
          totalItems,
          totalOpeningStock,
          totalClosingStock,
          monthlyBreakdown,
        },
      });
    }
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
