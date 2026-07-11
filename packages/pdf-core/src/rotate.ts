import { PDFDocument, degrees } from 'pdf-lib'
import type { PdfInputFile, PdfOperationResult, RotatePagesOptions } from '@private-pdf/shared-types'
import { validatePdfInput, validatePdfPageCount } from './validate'

export async function rotatePdfPages(
  inputFile: PdfInputFile,
  options: RotatePagesOptions
): Promise<PdfOperationResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    let doc: PDFDocument
    try {
      doc = await PDFDocument.load(inputFile.data)
    } catch {
      return {
        status: 'error',
        error: {
          code: 'PDF_PARSE_FAILED',
          userMessage:
            'We could not read this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const totalPages = doc.getPageCount()
    const pageCountErr = validatePdfPageCount(totalPages)
    if (pageCountErr) return { status: 'error', error: pageCountErr }
    const pages = doc.getPages()

    // Resolve which 0-based indices to rotate
    let targetIndices: number[]
    if (options.pages === 'all') {
      targetIndices = pages.map((_, i) => i)
    } else {
      // options.pages is 1-based page numbers
      const invalid = options.pages.find((n) => n < 1 || n > totalPages)
      if (invalid !== undefined) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_PAGE_RANGE',
            userMessage: `Page ${invalid} does not exist. This PDF has ${totalPages} page${totalPages === 1 ? '' : 's'}.`,
          },
        }
      }
      targetIndices = options.pages.map((n) => n - 1)
    }

    for (const idx of targetIndices) {
      const page = pages[idx]
      const current = page.getRotation().angle
      page.setRotation(degrees((current + options.degrees) % 360))
    }

    const data = await doc.save()

    return {
      status: 'success',
      fileName: 'rotated.pdf',
      mimeType: 'application/pdf',
      data,
    }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage:
          'We could not rotate this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
