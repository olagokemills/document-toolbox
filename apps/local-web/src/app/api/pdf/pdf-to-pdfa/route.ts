import { pdfToPdfA } from '@private-pdf/pdf-core'
import type { PdfInputFile } from '@private-pdf/shared-types'
import { uploadErrorResponse, validatePdfUpload } from '@/lib/uploadValidation'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a PDF file.' }, { status: 400 })
    }
    const uploadError = validatePdfUpload(file)
    if (uploadError) return uploadErrorResponse(uploadError)

    const inputFile: PdfInputFile = {
      data: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
    }

    const result = await pdfToPdfA(inputFile)
    if (result.status === 'error') {
      return Response.json({ error: result.error?.userMessage }, { status: 422 })
    }

    return new Response(Buffer.from(result.data!), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
      },
    })
  } catch {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
