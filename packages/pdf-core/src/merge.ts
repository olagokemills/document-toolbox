import { PDFDocument } from 'pdf-lib'
import { FILE_LIMITS } from '@private-pdf/shared-types'
import type { PdfInputFile, PdfOperationResult } from '@private-pdf/shared-types'
import { validatePdfInput } from './validate'

export async function mergePdfs(inputFiles: PdfInputFile[]): Promise<PdfOperationResult> {
  try {
    if (inputFiles.length < 2) {
      return {
        status: 'error',
        error: {
          code: 'TOO_MANY_FILES',
          userMessage: 'Please select at least 2 PDF files to merge.',
        },
      }
    }

    if (inputFiles.length > FILE_LIMITS.maxMergeFileCount) {
      return {
        status: 'error',
        error: {
          code: 'TOO_MANY_FILES',
          userMessage: `You can merge up to ${FILE_LIMITS.maxMergeFileCount} PDFs at once.`,
        },
      }
    }

    const totalSize = inputFiles.reduce((sum, f) => sum + f.data.byteLength, 0)
    if (totalSize > FILE_LIMITS.maxTotalInputSizeBytes) {
      return {
        status: 'error',
        error: {
          code: 'FILE_TOO_LARGE',
          userMessage: 'The total size of the selected files is too large. Try fewer or smaller PDFs.',
        },
      }
    }

    for (const file of inputFiles) {
      const err = validatePdfInput(file)
      if (err) return { status: 'error', error: err }
    }

    const merged = await PDFDocument.create()

    for (const file of inputFiles) {
      let src: PDFDocument
      try {
        src = await PDFDocument.load(file.data)
      } catch {
        return {
          status: 'error',
          error: {
            code: 'PDF_PARSE_FAILED',
            userMessage: `We could not read "${file.fileName}". The file may be corrupted, encrypted, or unsupported. Your files were not uploaded anywhere.`,
          },
        }
      }

      const pageCount = src.getPageCount()
      if (pageCount === 0) {
        return {
          status: 'error',
          error: {
            code: 'PDF_PARSE_FAILED',
            userMessage: `"${file.fileName}" appears to be empty.`,
          },
        }
      }

      const pages = await merged.copyPages(src, src.getPageIndices())
      pages.forEach((p) => merged.addPage(p))
    }

    const data = await merged.save()

    return {
      status: 'success',
      fileName: 'merged.pdf',
      mimeType: 'application/pdf',
      data,
    }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage:
          'We could not merge these PDFs. Please check that all files are valid PDF documents. Your files were not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
