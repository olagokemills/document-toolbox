import { PDFDocument } from 'pdf-lib'
import type { PdfInputFile, PdfOperationResult } from '@private-pdf/shared-types'
import { validatePdfInput, validatePdfPageCount } from './validate'

export async function removePdfMetadata(
  inputFile: PdfInputFile
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
          userMessage: 'We could not read this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const pageCountErr = validatePdfPageCount(doc.getPageCount())
    if (pageCountErr) return { status: 'error', error: pageCountErr }

    // Clear all common metadata fields
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setCreator('')
    doc.setProducer('')
    // Setting dates to epoch clears them as much as pdf-lib allows
    const epoch = new Date(0)
    doc.setCreationDate(epoch)
    doc.setModificationDate(epoch)

    const data = await doc.save()
    return { status: 'success', fileName: 'cleaned.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not remove metadata from this PDF. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
