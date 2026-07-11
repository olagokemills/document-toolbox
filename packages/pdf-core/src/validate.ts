import {
  FILE_LIMITS,
  type SafeOperationError,
  type PdfInputFile,
  type ImageInputFile,
} from '@private-pdf/shared-types'

export function validateFileSize(
  bytes: number,
  limit: number,
  label = 'file'
): SafeOperationError | null {
  if (bytes > limit) {
    return {
      code: 'FILE_TOO_LARGE',
      userMessage:
        'This file is too large for the current version. Try a smaller PDF or split the document first.',
      developerMessage: `${label} size ${bytes} exceeds limit ${limit}`,
    }
  }
  return null
}

export function validatePdfInput(file: PdfInputFile): SafeOperationError | null {
  const ext = file.fileName.split('.').pop()?.toLowerCase()
  if (ext !== 'pdf') {
    return {
      code: 'INVALID_FILE_TYPE',
      userMessage:
        'Only PDF files are accepted. Please select a file with a .pdf extension.',
      developerMessage: `File extension was "${ext}", expected "pdf"`,
    }
  }

  const sizeError = validateFileSize(
    file.data.byteLength,
    FILE_LIMITS.maxSinglePdfSizeBytes,
    file.fileName
  )
  if (sizeError) return sizeError

  // Magic bytes check — %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const magic = [0x25, 0x50, 0x44, 0x46, 0x2d]
  const hasMagic = magic.every((byte, i) => file.data[i] === byte)
  if (!hasMagic) {
    return {
      code: 'PDF_PARSE_FAILED',
      userMessage:
        'We could not process this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
      developerMessage: `File does not start with PDF magic bytes (%PDF-)`,
    }
  }

  return null
}

export function validateImageInput(file: ImageInputFile): SafeOperationError | null {
  const acceptedExtensions = ['.jpg', '.jpeg', '.png'] as const
  const acceptedTypes = ['image/jpeg', 'image/png'] as const
  const ext = '.' + file.fileName.split('.').pop()?.toLowerCase()
  if (!acceptedExtensions.includes(ext as typeof acceptedExtensions[number])) {
    return {
      code: 'INVALID_FILE_TYPE',
      userMessage:
        'Only JPG and PNG images are accepted.',
      developerMessage: `Image extension was "${ext}", expected one of ${acceptedExtensions.join(', ')}`,
    }
  }

  if (!acceptedTypes.includes(file.mimeType as typeof acceptedTypes[number])) {
    return {
      code: 'INVALID_FILE_TYPE',
      userMessage: 'Only JPG and PNG images are accepted.',
      developerMessage: `Image MIME type was "${file.mimeType}"`,
    }
  }

  const sizeError = validateFileSize(
    file.data.byteLength,
    FILE_LIMITS.maxSingleImageSizeBytes,
    file.fileName
  )
  return sizeError
}

export function validatePageRange(
  start: number,
  end: number,
  totalPages: number
): SafeOperationError | null {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
    return {
      code: 'INVALID_PAGE_RANGE',
      userMessage: 'Please enter valid page ranges. Example: 1-3, 5, 8-10.',
      developerMessage: `Page range values must be positive integers. Got start=${start}, end=${end}`,
    }
  }
  if (start > end) {
    return {
      code: 'INVALID_PAGE_RANGE',
      userMessage: 'Please enter valid page ranges. Example: 1-3, 5, 8-10.',
      developerMessage: `Range start (${start}) must be ≤ end (${end})`,
    }
  }
  if (end > totalPages) {
    return {
      code: 'INVALID_PAGE_RANGE',
      userMessage: `Page ${end} does not exist. This PDF has ${totalPages} page${totalPages === 1 ? '' : 's'}.`,
      developerMessage: `Range end ${end} exceeds total pages ${totalPages}`,
    }
  }
  return null
}

export function validatePdfPageCount(totalPages: number): SafeOperationError | null {
  if (totalPages > FILE_LIMITS.maxPdfPageCount) {
    return {
      code: 'FILE_TOO_LARGE',
      userMessage:
        'This file is too large for the current version. Try a smaller PDF or split the document first.',
      developerMessage: `PDF page count ${totalPages} exceeds limit ${FILE_LIMITS.maxPdfPageCount}`,
    }
  }
  return null
}
