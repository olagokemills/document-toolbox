import { FILE_LIMITS } from '@private-pdf/shared-types'

export interface UploadValidationError {
  status: 400 | 413
  message: string
}

export function validatePdfUpload(file: File): UploadValidationError | null {
  if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
    return { status: 400, message: 'Only PDF files are accepted.' }
  }
  if (file.size > FILE_LIMITS.maxSinglePdfSizeBytes) {
    return {
      status: 413,
      message: 'This file is too large for the current version. Try a smaller PDF or split the document first.',
    }
  }
  return null
}

export function uploadErrorResponse(error: UploadValidationError): Response {
  return Response.json({ error: error.message }, { status: error.status })
}
