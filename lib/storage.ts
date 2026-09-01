import { put, del } from '@vercel/blob';

/**
 * Uploads generated stock statement PDF to Vercel Blob storage.
 * Organizes files by western-industries/YEAR/MONTH/STATEMENT_NUMBER.pdf
 */
export async function uploadPdfToBlob(
  statementNumber: string,
  year: number,
  month: number,
  pdfBuffer: Buffer
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('BLOB_READ_WRITE_TOKEN is not configured. Skipping Vercel Blob upload.');
    return null;
  }

  const monthStr = String(month).padStart(2, '0');
  const pathname = `western-industries/${year}/${monthStr}/${statementNumber}.pdf`;

  try {
    const blob = await put(pathname, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false, // Keep clean path format
    });
    return blob.url;
  } catch (error) {
    console.error('Failed to upload PDF to Vercel Blob:', error);
    return null;
  }
}

/**
 * Deletes PDF file from Vercel Blob storage given its public URL.
 */
export async function deletePdfFromBlob(blobUrl: string): Promise<boolean> {
  if (!blobUrl || !process.env.BLOB_READ_WRITE_TOKEN) {
    return false;
  }

  try {
    await del(blobUrl);
    return true;
  } catch (error) {
    console.error('Failed to delete PDF from Vercel Blob:', error);
    return false;
  }
}
