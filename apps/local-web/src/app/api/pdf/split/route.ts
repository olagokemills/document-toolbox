import { splitPdf, packAsZip } from '@private-pdf/pdf-core'
import type { PdfInputFile, SplitPdfOptions } from '@private-pdf/shared-types'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const mode = formData.get('mode') as string
    const rangesRaw = formData.get('ranges') as string | null

    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a PDF file.' }, { status: 400 })
    }

    const inputFile: PdfInputFile = {
      data: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
    }

    let options: SplitPdfOptions
    if (mode === 'every-page') {
      options = { mode: 'every-page' }
    } else {
      if (!rangesRaw) {
        return Response.json(
          { error: 'Please enter at least one page range. Example: 1-3, 5, 8-10.' },
          { status: 400 }
        )
      }
      const ranges = parseRanges(rangesRaw)
      if (!ranges) {
        return Response.json(
          { error: 'Please enter valid page ranges. Example: 1-3, 5, 8-10.' },
          { status: 400 }
        )
      }
      options = { mode: 'ranges', ranges }
    }

    const result = await splitPdf(inputFile, options)

    if (result.status === 'error') {
      return Response.json({ error: result.error?.userMessage }, { status: 422 })
    }

    const files = result.files ?? []

    if (files.length === 1) {
      return new Response(Buffer.from(files[0].data), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${files[0].fileName}"`,
        },
      })
    }

    const zip = await packAsZip(files)
    return new Response(Buffer.from(zip), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="split-pages.zip"',
      },
    })
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

function parseRanges(raw: string): Array<{ start: number; end: number }> | null {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const result: Array<{ start: number; end: number }> = []
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/)
    if (!match) return null
    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : start
    if (isNaN(start) || isNaN(end) || start < 1 || end < start) return null
    result.push({ start, end })
  }
  return result.length > 0 ? result : null
}
