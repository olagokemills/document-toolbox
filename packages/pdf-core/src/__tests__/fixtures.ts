import { PDFDocument, rgb } from 'pdf-lib'
import type { PdfInputFile } from '@private-pdf/shared-types'

/** Create a real minimal PDF with N pages using pdf-lib. */
export async function makePdf(pageCount: number = 1, label = 'test.pdf'): Promise<PdfInputFile> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 300])
    page.drawText(`Page ${i + 1}`, { x: 50, y: 150, size: 20, color: rgb(0, 0, 0) })
  }
  const data = await doc.save()
  return { data, fileName: label }
}

/** Return a Uint8Array that is not a valid PDF (no magic bytes). */
export function makeInvalidPdf(label = 'bad.pdf'): PdfInputFile {
  const data = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04])
  return { data, fileName: label }
}

/** Return a file with a non-.pdf extension. */
export function makeWrongExtension(): PdfInputFile {
  return { data: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), fileName: 'document.docx' }
}

/** Count pages in a saved PDF Uint8Array. */
export async function pageCount(data: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(data)
  return doc.getPageCount()
}
