import { FILE_LIMITS } from '@private-pdf/shared-types'

export async function getPdfPageCount(file: File): Promise<number> {
  if (file.size > FILE_LIMITS.maxSinglePdfSizeBytes) {
    throw new Error('PDF exceeds the supported file size limit')
  }

  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })

  try {
    const document = await loadingTask.promise
    if (document.numPages > FILE_LIMITS.maxPdfPageCount) {
      throw new Error('PDF exceeds the supported page count limit')
    }
    return document.numPages
  } finally {
    await loadingTask.destroy()
  }
}
