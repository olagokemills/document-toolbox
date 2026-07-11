import JSZip from 'jszip'
import {
  adjustImages, blurImageAreas, compressImages, convertImages, createMeme,
  cropImage, removeImageMetadata, resizeImages, rotateImages, watermarkImages,
} from '@private-pdf/image-core'
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES, FILE_LIMITS } from '@private-pdf/shared-types'
import type {
  AdjustImagesOptions, BlurImageOptions, CompressImagesOptions, ConvertImagesOptions,
  CropImageOptions, ImageInputFile, ImageMimeType, MemeOptions, ResizeImagesOptions,
  RotateImagesOptions, WatermarkImagesOptions,
} from '@private-pdf/shared-types'

const OPERATIONS = new Set(['compress', 'resize', 'crop', 'rotate', 'convert', 'remove-metadata', 'watermark', 'blur', 'meme', 'adjust'])

function parseOptions<T>(form: FormData): T {
  const raw = form.get('options')
  if (typeof raw !== 'string') throw new Error('Missing operation options')
  return JSON.parse(raw) as T
}

async function toInput(file: File): Promise<ImageInputFile> {
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
  if (
    !ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number]) ||
    !ACCEPTED_IMAGE_EXTENSIONS.includes(extension as typeof ACCEPTED_IMAGE_EXTENSIONS[number])
  ) throw new Error('Only JPG, PNG, and WebP images are accepted.')
  if (file.size > FILE_LIMITS.maxSingleImageSizeBytes) throw new Error('Each image must be smaller than 20 MB.')
  return { fileName: file.name, mimeType: file.type as ImageMimeType, data: new Uint8Array(await file.arrayBuffer()) }
}

export async function POST(request: Request, { params }: { params: { operation: string } }) {
  try {
    if (!OPERATIONS.has(params.operation)) return Response.json({ error: 'Unknown image operation.' }, { status: 404 })
    const form = await request.formData()
    const rawFiles = form.getAll('images').filter((value): value is File => value instanceof File)
    if (rawFiles.length === 0) return Response.json({ error: 'Please select at least one image.' }, { status: 400 })
    if (rawFiles.length > FILE_LIMITS.maxImageCount) return Response.json({ error: `You can process up to ${FILE_LIMITS.maxImageCount} images at once.` }, { status: 400 })
    if (rawFiles.reduce((sum, file) => sum + file.size, 0) > FILE_LIMITS.maxTotalImageSizeBytes) return Response.json({ error: 'The selected images are too large.' }, { status: 413 })
    const files: ImageInputFile[] = []
    for (const file of rawFiles) files.push(await toInput(file))

    let result
    switch (params.operation) {
      case 'compress': result = await compressImages(files, parseOptions<CompressImagesOptions>(form)); break
      case 'resize': result = await resizeImages(files, parseOptions<ResizeImagesOptions>(form)); break
      case 'crop': result = await cropImage(files[0], parseOptions<CropImageOptions>(form)); break
      case 'rotate': result = await rotateImages(files, parseOptions<RotateImagesOptions>(form)); break
      case 'convert': result = await convertImages(files, parseOptions<ConvertImagesOptions>(form)); break
      case 'remove-metadata': result = await removeImageMetadata(files); break
      case 'blur': result = await blurImageAreas(files[0], parseOptions<BlurImageOptions>(form)); break
      case 'meme': result = await createMeme(files[0], parseOptions<MemeOptions>(form)); break
      case 'adjust': result = await adjustImages(files, parseOptions<AdjustImagesOptions>(form)); break
      case 'watermark': {
        const options = parseOptions<WatermarkImagesOptions>(form)
        const watermark = form.get('watermark')
        if (watermark instanceof File) options.image = await toInput(watermark)
        result = await watermarkImages(files, options)
        break
      }
      default: return Response.json({ error: 'Unknown image operation.' }, { status: 404 })
    }

    if (result.status === 'error' || !result.files) return Response.json({ error: result.error?.userMessage }, { status: 422 })
    const summary = encodeURIComponent(JSON.stringify(result.files.map(({ fileName, width, height, byteSize }) => ({ fileName, width, height, byteSize }))))
    if (result.files.length === 1) {
      const output = result.files[0]
      return new Response(Buffer.from(output.data), { headers: {
        'Content-Type': output.mimeType,
        'Content-Disposition': `attachment; filename="${output.fileName}"`,
        'X-Image-Results': summary,
      } })
    }
    const zip = new JSZip()
    for (const output of result.files) zip.file(output.fileName, output.data)
    return new Response(Buffer.from(await zip.generateAsync({ type: 'uint8array' })), { headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="processed-images.zip"',
      'X-Image-Results': summary,
    } })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'We could not process these images.' }, { status: 400 })
  }
}
