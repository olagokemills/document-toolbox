import { rotatePdfPages } from '@private-pdf/pdf-core'
import type { PdfInputFile, RotatePagesOptions } from '@private-pdf/shared-types'
import { uploadErrorResponse, validatePdfUpload } from '@/lib/uploadValidation'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const degreesRaw = formData.get('degrees') as string
    const pagesRaw = formData.get('pages') as string

    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a PDF file.' }, { status: 400 })
    }
    const uploadError = validatePdfUpload(file)
    if (uploadError) return uploadErrorResponse(uploadError)

    const deg = parseInt(degreesRaw, 10)
    if (deg !== 90 && deg !== 180 && deg !== 270) {
      return Response.json({ error: 'Rotation must be 90, 180, or 270 degrees.' }, { status: 400 })
    }

    const inputFile: PdfInputFile = {
      data: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
    }

    const options: RotatePagesOptions = {
      degrees: deg,
      pages: pagesRaw === 'all' ? 'all' : parsePageList(pagesRaw),
    }

    if (options.pages !== 'all' && options.pages.length === 0) {
      return Response.json({ error: 'Please select at least one page to rotate.' }, { status: 400 })
    }

    const result = await rotatePdfPages(inputFile, options)

    if (result.status === 'error') {
      return Response.json({ error: result.error?.userMessage }, { status: 422 })
    }

    return new Response(Buffer.from(result.data!), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
      },
    })
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

function parsePageList(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)
}
