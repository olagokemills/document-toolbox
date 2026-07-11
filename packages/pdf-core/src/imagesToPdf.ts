import { PDFDocument, PageSizes } from 'pdf-lib'
import { FILE_LIMITS } from '@private-pdf/shared-types'
import type { ImageInputFile, PdfOperationResult, ImagesToPdfOptions } from '@private-pdf/shared-types'
import { validateImageInput } from './validate'

export async function imagesToPdf(
  inputFiles: ImageInputFile[],
  options: ImagesToPdfOptions
): Promise<PdfOperationResult> {
  try {
    if (inputFiles.length === 0) {
      return {
        status: 'error',
        error: { code: 'NO_PAGES_SELECTED', userMessage: 'Please select at least one image.' },
      }
    }

    if (inputFiles.length > FILE_LIMITS.maxImageCount) {
      return {
        status: 'error',
        error: {
          code: 'TOO_MANY_FILES',
          userMessage: `You can convert up to ${FILE_LIMITS.maxImageCount} images at once.`,
        },
      }
    }

    const totalSize = inputFiles.reduce((sum, file) => sum + file.data.byteLength, 0)
    if (totalSize > FILE_LIMITS.maxTotalImageSizeBytes) {
      return {
        status: 'error',
        error: {
          code: 'FILE_TOO_LARGE',
          userMessage: 'The total size of the selected images is too large. Try fewer or smaller images.',
        },
      }
    }

    for (const file of inputFiles) {
      const err = validateImageInput(file)
      if (err) return { status: 'error', error: err }
    }

    const doc = await PDFDocument.create()

    for (const file of inputFiles) {
      const isJpeg = file.mimeType === 'image/jpeg'
      let img
      try {
        img = isJpeg ? await doc.embedJpg(file.data) : await doc.embedPng(file.data)
      } catch {
        return {
          status: 'error',
          error: {
            code: 'IMAGE_PARSE_FAILED',
            userMessage: `We could not read "${file.fileName}". The image may be corrupted or unsupported.`,
          },
        }
      }

      let pageWidth: number
      let pageHeight: number

      if (options.pageSize === 'a4-portrait') {
        ;[pageWidth, pageHeight] = PageSizes.A4
      } else if (options.pageSize === 'a4-landscape') {
        ;[pageHeight, pageWidth] = PageSizes.A4
      } else {
        // 'fit' — use image dimensions (in points, 72dpi)
        pageWidth = img.width
        pageHeight = img.height
      }

      const page = doc.addPage([pageWidth, pageHeight])

      // Scale image to fit within page while preserving aspect ratio
      const scale = Math.min(pageWidth / img.width, pageHeight / img.height)
      const drawWidth = img.width * scale
      const drawHeight = img.height * scale
      const x = (pageWidth - drawWidth) / 2
      const y = (pageHeight - drawHeight) / 2

      page.drawImage(img, { x, y, width: drawWidth, height: drawHeight })
    }

    const data = await doc.save()
    return { status: 'success', fileName: 'images.pdf', mimeType: 'application/pdf', data }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not convert these images to PDF. Your files were not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
