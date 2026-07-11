import { PDFDocument, rgb, degrees, type RGB } from 'pdf-lib'
import { FILE_LIMITS } from '@private-pdf/shared-types'
import type { PdfInputFile, PdfOperationResult, WatermarkOptions } from '@private-pdf/shared-types'
import { validatePdfInput, validatePdfPageCount } from './validate'

export async function addTextWatermark(
  inputFile: PdfInputFile,
  options: WatermarkOptions
): Promise<PdfOperationResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    if (!options.text.trim()) {
      return {
        status: 'error',
        error: { code: 'OPERATION_FAILED', userMessage: 'Please enter watermark text.' },
      }
    }

    if (options.text.length > FILE_LIMITS.maxWatermarkTextLength) {
      return {
        status: 'error',
        error: {
          code: 'OPERATION_FAILED',
          userMessage: `Watermark text must be ${FILE_LIMITS.maxWatermarkTextLength} characters or fewer.`,
        },
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
          userMessage: 'We could not read this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const totalPages = doc.getPageCount()
    const pageCountErr = validatePdfPageCount(totalPages)
    if (pageCountErr) return { status: 'error', error: pageCountErr }
    const allPages = doc.getPages()

    // Resolve which pages to watermark
    let targetIndices: number[]
    if (options.pages === 'all') {
      targetIndices = allPages.map((_, i) => i)
    } else {
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

    const font = await doc.embedFont('Helvetica')
    const fontSize = 36
    const opacity = options.opacity

    for (const idx of targetIndices) {
      const page = allPages[idx]
      const { width, height } = page.getSize()

      // Calculate position based on option
      const textWidth = font.widthOfTextAtSize(options.text, fontSize)
      const textHeight = fontSize

      let x: number
      let y: number
      const margin = 48

      switch (options.position) {
        case 'center':
          x = (width - textWidth) / 2
          y = (height - textHeight) / 2
          break
        case 'top-left':
          x = margin
          y = height - margin - textHeight
          break
        case 'top-right':
          x = width - textWidth - margin
          y = height - margin - textHeight
          break
        case 'bottom-left':
          x = margin
          y = margin
          break
        case 'bottom-right':
          x = width - textWidth - margin
          y = margin
          break
      }

      page.drawText(options.text, {
        x,
        y,
        size: fontSize,
        font,
        color: hexToRgb(options.color ?? '#666666'),
        opacity,
        rotate: degrees(options.rotation),
      })
    }

    const data = await doc.save()
    return { status: 'success', fileName: 'watermarked.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not add the watermark. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  )
}
