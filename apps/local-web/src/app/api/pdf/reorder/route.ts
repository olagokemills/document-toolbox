import { reorderPdfPages } from '@private-pdf/pdf-core'
import type { PdfInputFile } from '@private-pdf/shared-types'
import { uploadErrorResponse, validatePdfUpload } from '@/lib/uploadValidation'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const orderRaw = formData.get('order') as string

    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a PDF file.' }, { status: 400 })
    }
    const uploadError = validatePdfUpload(file)
    if (uploadError) return uploadErrorResponse(uploadError)

    const pageOrder = orderRaw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))

    if (pageOrder.length === 0) {
      return Response.json({ error: 'Please provide a page order.' }, { status: 400 })
    }

    const inputFile: PdfInputFile = {
      data: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
    }

    const result = await reorderPdfPages(inputFile, { pageOrder })
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
