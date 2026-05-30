export { mergePdfs } from './merge'
export { pdfToPdfA } from './pdfToPdfA'
export { pdfToDocx } from './pdfToDocx'
export { pdfToXlsx } from './pdfToXlsx'
export { lockPdf } from './lockPdf'
export { unlockPdf } from './unlockPdf'
export { splitPdf, packAsZip } from './split'
export { rotatePdfPages } from './rotate'
export { reorderPdfPages } from './reorder'
export { deletePdfPages } from './deletePages'
export { extractPdfPages } from './extract'
export { imagesToPdf } from './imagesToPdf'
export { addTextWatermark } from './watermark'
export { removePdfMetadata } from './removeMetadata'
export * from './validate'

// PDF-to-images is handled client-side via pdfjs-dist (browser canvas)
// The function below is a typed placeholder so the API surface stays complete.
import type { PdfInputFile, ImageOperationResult, PdfToImagesOptions } from '@private-pdf/shared-types'

export async function pdfToImages(
  _inputFile: PdfInputFile,
  _options: PdfToImagesOptions
): Promise<ImageOperationResult> {
  return {
    status: 'error',
    error: {
      code: 'OPERATION_FAILED',
      userMessage: 'PDF to images is rendered in the browser.',
    },
  }
}
