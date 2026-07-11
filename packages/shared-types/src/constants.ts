export const FILE_LIMITS = {
  maxSinglePdfSizeBytes: 100 * 1024 * 1024,
  maxTotalInputSizeBytes: 250 * 1024 * 1024,
  maxMergeFileCount: 50,
  maxPdfPageCount: 1000,
  maxSingleImageSizeBytes: 20 * 1024 * 1024,
  maxTotalImageSizeBytes: 200 * 1024 * 1024,
  maxImageCount: 100,
  maxWatermarkTextLength: 100,
} as const

export const PDF_MAGIC_BYTES = '%PDF-'

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const
