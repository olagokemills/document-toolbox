export type OperationStatus = 'success' | 'error'

export type ErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'PDF_PARSE_FAILED'
  | 'PDF_ENCRYPTED_UNSUPPORTED'
  | 'INVALID_PAGE_RANGE'
  | 'NO_PAGES_SELECTED'
  | 'ALL_PAGES_DELETED'
  | 'IMAGE_PARSE_FAILED'
  | 'INVALID_PASSWORD'
  | 'OPERATION_FAILED'

export interface SafeOperationError {
  code: ErrorCode
  userMessage: string
  developerMessage?: string
}

export interface PdfOperationResult {
  status: OperationStatus
  fileName?: string
  mimeType?: 'application/pdf'
  data?: Uint8Array
  error?: SafeOperationError
}

export interface PdfSplitResult {
  status: OperationStatus
  files?: Array<{
    fileName: string
    mimeType: 'application/pdf'
    data: Uint8Array
  }>
  error?: SafeOperationError
}

export interface ImageOperationResult {
  status: OperationStatus
  files?: Array<{
    fileName: string
    mimeType: 'image/png'
    data: Uint8Array
  }>
  error?: SafeOperationError
}

export interface PdfInputFile {
  data: Uint8Array
  fileName: string
}

export type ImageMimeType = 'image/jpeg' | 'image/png'

export interface ImageInputFile {
  data: Uint8Array
  fileName: string
  mimeType: ImageMimeType
}

// Operation option types

export interface SplitPdfOptions {
  mode: 'ranges' | 'every-page'
  ranges?: Array<{ start: number; end: number }>
}

export interface ReorderPagesOptions {
  pageOrder: number[]
}

export interface DeletePagesOptions {
  pagesToDelete: number[]
}

export interface RotatePagesOptions {
  pages: number[] | 'all'
  degrees: 90 | 180 | 270
}

export interface ExtractPagesOptions {
  ranges: Array<{ start: number; end: number }>
}

export type ImagePageSize = 'fit' | 'a4-portrait' | 'a4-landscape'

export interface ImagesToPdfOptions {
  pageSize: ImagePageSize
}

export interface PdfToImagesOptions {
  pages: number[] | 'all'
  format: 'png'
}

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface WatermarkOptions {
  text: string
  position: WatermarkPosition
  opacity: 0.1 | 0.25 | 0.5
  rotation: 0 | 45
  pages: number[] | 'all'
  color: string  // hex e.g. '#666666'
}

// Generic result for non-PDF output formats (DOCX, XLSX, PPTX, etc.)
export interface ConversionResult {
  status: OperationStatus
  fileName?: string
  mimeType?: string
  data?: Uint8Array
  error?: SafeOperationError
}

export interface PdfToJpgOptions {
  pages: number[] | 'all'
  quality: 0.75 | 0.9  // JPEG quality: 0.75 = standard, 0.9 = high
}

export interface LockPdfOptions {
  userPassword: string    // password required to open the document
  ownerPassword?: string  // admin password; defaults to same as userPassword
  allowPrinting?: boolean
  allowCopying?: boolean
}

export interface UnlockPdfOptions {
  password: string  // current user password
}
