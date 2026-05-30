import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import type { PdfInputFile, PdfSplitResult, SplitPdfOptions } from '@private-pdf/shared-types'
import { validatePdfInput, validatePageRange } from './validate'

export async function splitPdf(
  inputFile: PdfInputFile,
  options: SplitPdfOptions
): Promise<PdfSplitResult> {
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
          userMessage:
            'We could not read this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const totalPages = src.getPageCount()

    if (options.mode === 'every-page') {
      const files: PdfSplitResult['files'] = []

      for (let i = 0; i < totalPages; i++) {
        const doc = await PDFDocument.create()
        const [page] = await doc.copyPages(src, [i])
        doc.addPage(page)
        const data = await doc.save()
        files.push({
          fileName: `page-${i + 1}.pdf`,
          mimeType: 'application/pdf',
          data,
        })
      }

      return { status: 'success', files }
    }

    // ranges mode
    const ranges = options.ranges ?? []
    if (ranges.length === 0) {
      return {
        status: 'error',
        error: {
          code: 'INVALID_PAGE_RANGE',
          userMessage: 'Please enter at least one page range. Example: 1-3, 5, 8-10.',
        },
      }
    }

    const files: PdfSplitResult['files'] = []

    for (let ri = 0; ri < ranges.length; ri++) {
      const { start, end } = ranges[ri]
      const rangeErr = validatePageRange(start, end, totalPages)
      if (rangeErr) return { status: 'error', error: rangeErr }

      const doc = await PDFDocument.create()
      // Convert 1-based page numbers to 0-based indices
      const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i)
      const pages = await doc.copyPages(src, indices)
      pages.forEach((p) => doc.addPage(p))
      const data = await doc.save()

      const label = start === end ? `page-${start}` : `pages-${start}-${end}`
      files.push({
        fileName: `${label}.pdf`,
        mimeType: 'application/pdf',
        data,
      })
    }

    return { status: 'success', files }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage:
          'We could not split this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}

export async function packAsZip(
  files: Array<{ fileName: string; data: Uint8Array }>
): Promise<Uint8Array> {
  const zip = new JSZip()
  for (const f of files) {
    zip.file(f.fileName, f.data)
  }
  const blob = await zip.generateAsync({ type: 'uint8array' })
  return blob
}
