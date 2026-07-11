import { PDFDocument } from 'pdf-lib'
import type { PdfInputFile, PdfOperationResult, ReorderPagesOptions } from '@private-pdf/shared-types'
import { validatePdfInput, validatePdfPageCount } from './validate'

export async function reorderPdfPages(
  inputFile: PdfInputFile,
  options: ReorderPagesOptions
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
    const { pageOrder } = options

    const pageCountErr = validatePdfPageCount(totalPages)
    if (pageCountErr) return { status: 'error', error: pageCountErr }

    if (pageOrder.length === 0) {
      return {
        status: 'error',
        error: { code: 'NO_PAGES_SELECTED', userMessage: 'Please provide a page order.' },
      }
    }

    for (const n of pageOrder) {
      if (!Number.isInteger(n) || n < 1 || n > totalPages) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_PAGE_RANGE',
            userMessage: `Page ${n} does not exist. This PDF has ${totalPages} page${totalPages === 1 ? '' : 's'}.`,
          },
        }
      }
    }

    const uniquePages = new Set(pageOrder)
    if (pageOrder.length !== totalPages || uniquePages.size !== totalPages) {
      return {
        status: 'error',
        error: {
          code: 'INVALID_PAGE_RANGE',
          userMessage: `Enter every page exactly once. This PDF has ${totalPages} page${totalPages === 1 ? '' : 's'}.`,
          developerMessage: `Expected a permutation of 1..${totalPages}, received ${pageOrder.join(',')}`,
        },
      }
    }

    const doc = await PDFDocument.create()
    // pageOrder is 1-based
    const indices = pageOrder.map((n) => n - 1)
    const pages = await doc.copyPages(src, indices)
    pages.forEach((p) => doc.addPage(p))

    const data = await doc.save()
    return { status: 'success', fileName: 'reordered.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not reorder this PDF. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
