import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateStatementNumber } from '@/lib/statement-number';
import { CreateStatementSchema } from '@/lib/validations';
import { pdf } from '@react-pdf/renderer';
import { StockStatementDocument } from '@/lib/pdf-generator';
import { uploadPdfToBlob } from '@/lib/storage';
import { Statement } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const vendor = searchParams.get('vendor');
    const sort = searchParams.get('sort') || 'recent'; // 'recent' | 'oldest' | 'updated' | 'statement_num'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (month) where.month = parseInt(month, 10);
    if (year) where.year = parseInt(year, 10);
    if (vendor) where.vendorCode = vendor;

    if (search) {
      where.OR = [
        { statementNumber: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { vendorCode: { contains: search, mode: 'insensitive' } },
        {
          items: {
            some: {
              OR: [
                { daNumber: { contains: search, mode: 'insensitive' } },
                { partNumber: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Determine sort order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: 'desc' }; // Default: Most recent first
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'updated') {
      orderBy = { updatedAt: 'desc' };
    } else if (sort === 'statement_num') {
      orderBy = { statementNumber: 'asc' };
    }

    const [statements, total] = await Promise.all([
      prisma.statement.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: { select: { items: true } },
        },
      }),
      prisma.statement.count({ where }),
    ]);

    return NextResponse.json({
      data: statements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/statements error:', error);
    return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateStatementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { industryName, vendorName, vendorCode, month, year, items } = parsed.data;

    const statementNumber = await generateStatementNumber(month, year);

    // Create statement + items in Neon PostgreSQL
    let statement = await prisma.statement.create({
      data: {
        statementNumber,
        industryName,
        vendorName,
        vendorCode,
        month,
        year,
        status: 'saved',
        items: {
          create: items.map((item, idx) => ({
            serialNumber: idx + 1,
            daNumber: item.daNumber || null,
            entryDate: new Date(item.entryDate),
            partNumber: item.partNumber,
            despatches: item.despatches || null,
            openingStock: item.openingStock ?? 0,
            closingStock: item.closingStock,
          })),
        },
      },
      include: { items: { orderBy: { serialNumber: 'asc' } } },
    });

    // Auto-generate PDF & upload to Vercel Blob if token configured
    try {
      const formattedStatement: Statement = {
        ...statement,
        createdAt: statement.createdAt.toISOString(),
        updatedAt: statement.updatedAt.toISOString(),
        items: statement.items.map((it) => ({
          ...it,
          entryDate: it.entryDate.toISOString(),
          openingStock: Number(it.openingStock),
          closingStock: Number(it.closingStock),
          createdAt: it.createdAt.toISOString(),
          updatedAt: it.updatedAt.toISOString(),
        })),
      };

      const pdfBlob = await pdf(
        StockStatementDocument({ statement: formattedStatement, generatedAt: new Date() })
      ).toBlob();

      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

      const blobUrl = await uploadPdfToBlob(
        statement.statementNumber,
        statement.year,
        statement.month,
        pdfBuffer
      );

      if (blobUrl) {
        statement = await prisma.statement.update({
          where: { id: statement.id },
          data: { pdfUrl: blobUrl },
          include: { items: { orderBy: { serialNumber: 'asc' } } },
        });
      }
    } catch (pdfErr) {
      console.error('PDF auto-generation/Vercel Blob upload warning:', pdfErr);
    }

    return NextResponse.json({ data: statement }, { status: 201 });
  } catch (error) {
    console.error('POST /api/statements error:', error);
    return NextResponse.json({ error: 'Failed to create statement' }, { status: 500 });
  }
}
