import { PDFDocument } from '@cantoo/pdf-lib'
import type { PdfInputFile, PdfOperationResult, UnlockPdfOptions } from '@private-pdf/shared-types'
import { validatePdfInput } from './validate'

export async function unlockPdf(
  inputFile: PdfInputFile,
  options: UnlockPdfOptions,
): Promise<PdfOperationResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    let doc: PDFDocument
    try {
      doc = await PDFDocument.load(inputFile.data, { password: options.password })
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('password') || msg.includes('encrypt') || msg.includes('decrypt') || msg.includes('incorrect')) {
        return {
          status: 'error',
          error: {
            code: 'INVALID_PASSWORD',
            userMessage:
              'Incorrect password, or this PDF uses an encryption format that is not supported. Your file was not uploaded anywhere.',
          },
        }
      }
      return {
        status: 'error',
        error: {
          code: 'PDF_PARSE_FAILED',
          userMessage:
            'We could not read this PDF. The file may be corrupted or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    // Save without calling encrypt() — produces an unencrypted copy
    const data = await doc.save()
    return { status: 'success', fileName: 'unlocked.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not unlock this PDF. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
