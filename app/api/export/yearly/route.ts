import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateYearlyExcel } from '@/lib/excel-generator';
import { Statement } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');

    if (!yearStr) {
      return NextResponse.json(
        { error: 'Year is a required parameter' },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr, 10);

    const rawStatements = await prisma.statement.findMany({
      where: { year },
      orderBy: [{ month: 'asc' }, { createdAt: 'asc' }],
      include: {
        items: { orderBy: { serialNumber: 'asc' } },
      },
    });

    const statements: Statement[] = rawStatements.map((s) => ({
      ...s,
      statementDate: s.statementDate ? s.statementDate.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      items: s.items.map((item) => ({
        ...item,
        entryDate: item.entryDate ? item.entryDate.toISOString() : null,
        openingStock: Number(item.openingStock),
        closingStock: Number(item.closingStock),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    }));

    const excelBuffer = generateYearlyExcel(statements, year);
    const filename = `WESTERN_INDUSTRIES_TVS_${year}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/export/yearly error:', error);
    return NextResponse.json({ error: 'Failed to generate yearly Excel report' }, { status: 500 });
  }
}
