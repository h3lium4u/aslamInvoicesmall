import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMonthlyExcel } from '@/lib/excel-generator';
import { Statement } from '@/types';
import { MONTHS } from '@/lib/statement-number';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    if (!monthStr || !yearStr) {
      return NextResponse.json(
        { error: 'Month and year are required parameters' },
        { status: 400 }
      );
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    const rawStatements = await prisma.statement.findMany({
      where: { month, year },
      orderBy: { createdAt: 'asc' },
      include: {
        items: { orderBy: { serialNumber: 'asc' } },
      },
    });

    const statements: Statement[] = rawStatements.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      items: s.items.map((item) => ({
        ...item,
        entryDate: item.entryDate.toISOString(),
        openingStock: Number(item.openingStock),
        closingStock: Number(item.closingStock),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    }));

    const monthName = MONTHS[month - 1] || `Month${month}`;
    const excelBuffer = generateMonthlyExcel(statements, month, year);
    const filename = `WESTERN_INDUSTRIES_TVS_${monthName}_${year}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/export/monthly error:', error);
    return NextResponse.json({ error: 'Failed to generate monthly Excel report' }, { status: 500 });
  }
}
