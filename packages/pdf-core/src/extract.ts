import { PDFDocument } from 'pdf-lib'
import type { PdfInputFile, PdfOperationResult, ExtractPagesOptions } from '@private-pdf/shared-types'
import { validatePdfInput, validatePageRange } from './validate'

export async function extractPdfPages(
  inputFile: PdfInputFile,
  options: ExtractPagesOptions
): Promise<PdfOperationResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    let src: PDFDocument
    try {
      src = await PDFDocument.load(inputFile.data)
    } catch {
      return {
        status: 'error',
        error: {
          code: 'PDF_PARSE_FAILED',
          userMessage: 'We could not read this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const totalPages = src.getPageCount()

    if (options.ranges.length === 0) {
      return {
        status: 'error',
        error: { code: 'INVALID_PAGE_RANGE', userMessage: 'Please enter at least one page range.' },
      }
    }

    for (const { start, end } of options.ranges) {
      const err = validatePageRange(start, end, totalPages)
      if (err) return { status: 'error', error: err }
    }

    // Collect unique 0-based indices in order, preserving range order
    const seen = new Set<number>()
    const indices: number[] = []
    for (const { start, end } of options.ranges) {
      for (let i = start; i <= end; i++) {
        if (!seen.has(i)) { seen.add(i); indices.push(i - 1) }
      }
    }

    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, indices)
    pages.forEach((p) => doc.addPage(p))

    const data = await doc.save()
    return { status: 'success', fileName: 'extracted.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not extract pages from this PDF. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
