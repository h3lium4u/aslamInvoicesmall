import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateStatementSchema } from '@/lib/validations';
import { pdf } from '@react-pdf/renderer';
import { StockStatementDocument } from '@/lib/pdf-generator';
import { uploadPdfToBlob, deletePdfFromBlob } from '@/lib/storage';
import { Statement } from '@/types';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const statement = await prisma.statement.findUnique({
      where: { id },
      include: {
        items: { orderBy: { serialNumber: 'asc' } },
      },
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    return NextResponse.json({ data: statement });
  } catch (error) {
    console.error('GET /api/statements/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CreateStatementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { industryName, vendorName, vendorCode, month, year, statementDate, items } = parsed.data;

    const existing = await prisma.statement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    const stmtDateObj = statementDate ? new Date(statementDate) : existing.statementDate || new Date();

    // Atomic Neon transaction: delete old items, update statement, create new items
    let updated = await prisma.$transaction(async (tx) => {
      await tx.statementItem.deleteMany({ where: { statementId: id } });

      return tx.statement.update({
        where: { id },
        data: {
          industryName,
          vendorName,
          vendorCode,
          month,
          year,
          statementDate: stmtDateObj,
          pdfUrl: null, // Reset for new Blob upload
          items: {
            create: items.map((item, idx) => ({
              serialNumber: idx + 1,
              daNumber: item.daNumber || null,
              entryDate: item.entryDate ? new Date(item.entryDate) : stmtDateObj,
              partNumber: item.partNumber || '',
              despatches: item.despatches || null,
              openingStock: item.openingStock ?? 0,
              closingStock: item.closingStock,
            })),
          },
        },
        include: { items: { orderBy: { serialNumber: 'asc' } } },
      });
    });

    // Delete old PDF from Vercel Blob if existed
    if (existing.pdfUrl) {
      await deletePdfFromBlob(existing.pdfUrl);
    }

    // Regenerate & upload updated PDF to Vercel Blob
    try {
      const formattedStatement: Statement = {
        ...updated,
        statementDate: updated.statementDate ? updated.statementDate.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        items: updated.items.map((it) => ({
          ...it,
          entryDate: it.entryDate ? it.entryDate.toISOString() : null,
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
        updated.statementNumber,
        updated.year,
        updated.month,
        pdfBuffer
      );

      if (blobUrl) {
        updated = await prisma.statement.update({
          where: { id: updated.id },
          data: { pdfUrl: blobUrl },
          include: { items: { orderBy: { serialNumber: 'asc' } } },
        });
      }
    } catch (pdfErr) {
      console.error('PDF regeneration/Vercel Blob update warning:', pdfErr);
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PUT /api/statements/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update statement' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.statement.findUnique({
      where: { id },
      select: { id: true, pdfUrl: true, statementNumber: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    // Delete from Neon PostgreSQL (cascade deletes items)
    await prisma.statement.delete({ where: { id } });

    // Remove associated PDF from Vercel Blob storage
    if (existing.pdfUrl) {
      await deletePdfFromBlob(existing.pdfUrl);
    }

    return NextResponse.json({ message: 'Statement deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/statements/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 });
  }
}
