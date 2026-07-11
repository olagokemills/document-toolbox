import { lockPdf } from '@private-pdf/pdf-core'
import type { PdfInputFile } from '@private-pdf/shared-types'
import { uploadErrorResponse, validatePdfUpload } from '@/lib/uploadValidation'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const userPassword = (formData.get('userPassword') as string)?.trim()
    const ownerPassword = (formData.get('ownerPassword') as string)?.trim() || undefined
    const allowPrinting = formData.get('allowPrinting') === 'true'
    const allowCopying = formData.get('allowCopying') === 'true'

    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a PDF file.' }, { status: 400 })
    }
    const uploadError = validatePdfUpload(file)
    if (uploadError) return uploadErrorResponse(uploadError)
    if (!userPassword) {
      return Response.json({ error: 'Please enter a password.' }, { status: 400 })
    }

    const inputFile: PdfInputFile = {
      data: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
    }

    const result = await lockPdf(inputFile, { userPassword, ownerPassword, allowPrinting, allowCopying })
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
