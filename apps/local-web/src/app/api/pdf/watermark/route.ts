import { addTextWatermark } from '@private-pdf/pdf-core'
import type { PdfInputFile, WatermarkOptions, WatermarkPosition } from '@private-pdf/shared-types'
import { uploadErrorResponse, validatePdfUpload } from '@/lib/uploadValidation'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const text = (formData.get('text') as string)?.trim()
    const position = (formData.get('position') as WatermarkPosition) ?? 'center'
    const opacity = parseFloat(formData.get('opacity') as string)
    const rotation = parseInt(formData.get('rotation') as string, 10)
    const pagesRaw = formData.get('pages') as string

    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a PDF file.' }, { status: 400 })
    }
    const uploadError = validatePdfUpload(file)
    if (uploadError) return uploadErrorResponse(uploadError)
    if (!text) {
      return Response.json({ error: 'Please enter watermark text.' }, { status: 400 })
    }

    const opacityVal = [0.1, 0.25, 0.5].includes(opacity) ? (opacity as 0.1 | 0.25 | 0.5) : 0.25
    const rotationVal = rotation === 45 ? 45 : 0

    const inputFile: PdfInputFile = {
      data: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
    }

    const color = (formData.get('color') as string) || '#666666'

    const options: WatermarkOptions = {
      text,
      position,
      opacity: opacityVal,
      rotation: rotationVal,
      pages: pagesRaw === 'all' ? 'all' : parsePageList(pagesRaw),
      color,
    }

    const result = await addTextWatermark(inputFile, options)
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

function parsePageList(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)
}
