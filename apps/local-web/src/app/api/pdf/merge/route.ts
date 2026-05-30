import { mergePdfs } from '@private-pdf/pdf-core'
import { FILE_LIMITS } from '@private-pdf/shared-types'
import type { PdfInputFile } from '@private-pdf/shared-types'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const rawFiles = formData.getAll('files')

    const files: File[] = rawFiles.filter((f): f is File => f instanceof File)

    if (files.length < 2) {
      return Response.json(
        { error: 'Please select at least 2 PDF files to merge.' },
        { status: 400 }
      )
    }

    const inputFiles: PdfInputFile[] = await Promise.all(
      files.map(async (f) => ({
        data: new Uint8Array(await f.arrayBuffer()),
        fileName: f.name,
      }))
    )

    const totalSize = inputFiles.reduce((s, f) => s + f.data.byteLength, 0)
    if (totalSize > FILE_LIMITS.maxTotalInputSizeBytes) {
      return Response.json(
        { error: 'The total file size is too large. Try fewer or smaller PDFs.' },
        { status: 413 }
      )
    }

    const result = await mergePdfs(inputFiles)

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
