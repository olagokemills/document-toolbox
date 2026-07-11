import { imagesToPdf } from '@private-pdf/pdf-core'
import { FILE_LIMITS } from '@private-pdf/shared-types'
import type { ImageInputFile, ImagesToPdfOptions, ImagePageSize } from '@private-pdf/shared-types'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const rawFiles = formData.getAll('images')
    const pageSize = (formData.get('pageSize') as ImagePageSize) ?? 'fit'

    const files = rawFiles.filter((f): f is File => f instanceof File)

    if (files.length === 0) {
      return Response.json({ error: 'Please select at least one image.' }, { status: 400 })
    }

    if (files.length > FILE_LIMITS.maxImageCount) {
      return Response.json(
        { error: `You can convert up to ${FILE_LIMITS.maxImageCount} images at once.` },
        { status: 400 }
      )
    }

    const validPageSizes: ImagePageSize[] = ['fit', 'a4-portrait', 'a4-landscape']
    if (!validPageSizes.includes(pageSize)) {
      return Response.json({ error: 'Please select a valid page size.' }, { status: 400 })
    }

    const oversized = files.find((file) => file.size > FILE_LIMITS.maxSingleImageSizeBytes)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (oversized || totalSize > FILE_LIMITS.maxTotalImageSizeBytes) {
      return Response.json(
        { error: 'The selected images are too large. Try fewer or smaller images.' },
        { status: 413 },
      )
    }

    const inputFiles: ImageInputFile[] = await Promise.all(
      files.map(async (f) => {
        const mimeType = f.type as 'image/jpeg' | 'image/png'
        return {
          data: new Uint8Array(await f.arrayBuffer()),
          fileName: f.name,
          mimeType,
        }
      })
    )

    const invalidType = inputFiles.find(
      (f) => !ACCEPTED_IMAGE_TYPES.includes(f.mimeType as typeof ACCEPTED_IMAGE_TYPES[number])
    )
    if (invalidType) {
      return Response.json(
        { error: `"${invalidType.fileName}" is not a supported image. Only JPG and PNG are accepted.` },
        { status: 400 }
      )
    }

    const options: ImagesToPdfOptions = { pageSize }
    const result = await imagesToPdf(inputFiles, options)

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
