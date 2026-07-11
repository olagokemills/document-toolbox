import { PDFDocument } from '@cantoo/pdf-lib'
import type { PdfInputFile, PdfOperationResult, LockPdfOptions } from '@private-pdf/shared-types'
import { validatePdfInput, validatePdfPageCount } from './validate'

export async function lockPdf(
  inputFile: PdfInputFile,
  options: LockPdfOptions,
): Promise<PdfOperationResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    if (!options.userPassword.trim()) {
      return {
        status: 'error',
        error: { code: 'OPERATION_FAILED', userMessage: 'Please enter a password.' },
      }
    }

    let doc: PDFDocument
    try {
      doc = await PDFDocument.load(inputFile.data)
    } catch {
      return {
        status: 'error',
        error: {
          code: 'PDF_PARSE_FAILED',
          userMessage:
            'We could not read this PDF. The file may be corrupted or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const pageCountErr = validatePdfPageCount(doc.getPageCount())
    if (pageCountErr) return { status: 'error', error: pageCountErr }

    doc.encrypt({
      userPassword: options.userPassword,
      ownerPassword: options.ownerPassword ?? options.userPassword,
      permissions: {
        printing: options.allowPrinting !== false ? 'highResolution' : false,
        modifying: false,
        copying: options.allowCopying ?? false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      },
    })

    const data = await doc.save()
    return { status: 'success', fileName: 'locked.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not lock this PDF. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
