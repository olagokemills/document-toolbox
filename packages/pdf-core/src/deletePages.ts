import { PDFDocument } from 'pdf-lib'
import type { PdfInputFile, PdfOperationResult, DeletePagesOptions } from '@private-pdf/shared-types'
import { validatePdfInput } from './validate'

export async function deletePdfPages(
  inputFile: PdfInputFile,
  options: DeletePagesOptions
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
    const toDelete = new Set(options.pagesToDelete)

    if (toDelete.size === 0) {
      return {
        status: 'error',
        error: { code: 'NO_PAGES_SELECTED', userMessage: 'Please select at least one page to delete.' },
      }
    }

    const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
      (i) => !toDelete.has(i + 1)
    )

    if (keepIndices.length === 0) {
      return {
        status: 'error',
        error: {
          code: 'ALL_PAGES_DELETED',
          userMessage: 'A PDF must contain at least one page. Please leave at least one page selected.',
        },
      }
    }

    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, keepIndices)
    pages.forEach((p) => doc.addPage(p))

    const data = await doc.save()
    return { status: 'success', fileName: 'deleted-pages.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not process this PDF. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
