import sharp, { type OverlayOptions } from 'sharp'
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_TYPES,
  FILE_LIMITS,
  type AdjustImagesOptions,
  type BlurImageOptions,
  type CompressImagesOptions,
  type ConvertImagesOptions,
  type CropImageOptions,
  type ImageFormat,
  type ImageInputFile,
  type ImageMimeType,
  type ImageOperationResult,
  type ImageOutputFile,
  type MemeOptions,
  type ResizeImagesOptions,
  type RotateImagesOptions,
  type SafeOperationError,
  type WatermarkImagesOptions,
} from '@private-pdf/shared-types'

const MIME_BY_FORMAT: Record<ImageFormat, ImageMimeType> = {
  jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
}
const EXT_BY_FORMAT: Record<ImageFormat, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' }

function failure(error: SafeOperationError): ImageOperationResult {
  return { status: 'error', error }
}

function operationFailure(error: unknown): ImageOperationResult {
  return failure({
    code: 'OPERATION_FAILED',
    userMessage: 'We could not process this image. It may be corrupted or unsupported. Your file was not uploaded anywhere.',
    developerMessage: error instanceof Error ? error.message : String(error),
  })
}

async function validateInputs(files: ImageInputFile[]): Promise<SafeOperationError | null> {
  if (files.length === 0) return { code: 'NO_PAGES_SELECTED', userMessage: 'Please select at least one image.' }
  if (files.length > FILE_LIMITS.maxImageCount) {
    return { code: 'TOO_MANY_FILES', userMessage: `You can process up to ${FILE_LIMITS.maxImageCount} images at once.` }
  }
  const total = files.reduce((sum, file) => sum + file.data.byteLength, 0)
  if (total > FILE_LIMITS.maxTotalImageSizeBytes) {
    return { code: 'FILE_TOO_LARGE', userMessage: 'The selected images are too large. Try fewer or smaller images.' }
  }
  for (const file of files) {
    const extension = `.${file.fileName.split('.').pop()?.toLowerCase()}`
    if (
      !ACCEPTED_IMAGE_TYPES.includes(file.mimeType) ||
      !ACCEPTED_IMAGE_EXTENSIONS.includes(extension as typeof ACCEPTED_IMAGE_EXTENSIONS[number])
    ) return { code: 'INVALID_FILE_TYPE', userMessage: 'Only JPG, PNG, and WebP images are accepted.' }
    if (file.data.byteLength > FILE_LIMITS.maxSingleImageSizeBytes) {
      return { code: 'FILE_TOO_LARGE', userMessage: 'This image is too large. Choose an image smaller than 20 MB.' }
    }
    try {
      const metadata = await sharp(file.data, { animated: true }).metadata()
      if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
        return { code: 'IMAGE_PARSE_FAILED', userMessage: 'We could not read one of these images. It may be corrupted or unsupported.' }
      }
      if ((metadata.pages ?? 1) > 1) {
        return { code: 'INVALID_FILE_TYPE', userMessage: 'Animated images are not supported. Please choose a static JPG, PNG, or WebP image.' }
      }
    } catch {
      return { code: 'IMAGE_PARSE_FAILED', userMessage: 'We could not read one of these images. It may be corrupted or unsupported.' }
    }
  }
  return null
}

function formatFor(file: ImageInputFile): ImageFormat {
  return file.mimeType === 'image/jpeg' ? 'jpeg' : file.mimeType === 'image/webp' ? 'webp' : 'png'
}

function outputName(fileName: string, suffix: string, format: ImageFormat): string {
  return `${fileName.replace(/\.[^.]+$/, '')}-${suffix}.${EXT_BY_FORMAT[format]}`
}

async function encode(
  pipeline: sharp.Sharp,
  format: ImageFormat,
  quality = 85,
  background = '#ffffff',
): Promise<Buffer> {
  if (format === 'jpeg') return pipeline.flatten({ background }).jpeg({ quality, mozjpeg: true }).toBuffer()
  if (format === 'webp') return pipeline.webp({ quality, effort: 5 }).toBuffer()
  return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
}

async function toOutput(data: Buffer, fileName: string, format: ImageFormat): Promise<ImageOutputFile> {
  const metadata = await sharp(data).metadata()
  return {
    fileName,
    mimeType: MIME_BY_FORMAT[format],
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    byteSize: data.byteLength,
    data: new Uint8Array(data),
  }
}

async function batch(
  files: ImageInputFile[],
  transform: (file: ImageInputFile) => Promise<ImageOutputFile>,
): Promise<ImageOperationResult> {
  try {
    const error = await validateInputs(files)
    if (error) return failure(error)
    const outputs: ImageOutputFile[] = []
    for (const file of files) outputs.push(await transform(file))
    return { status: 'success', files: outputs }
  } catch (error) {
    return operationFailure(error)
  }
}

export async function compressImages(files: ImageInputFile[], options: CompressImagesOptions): Promise<ImageOperationResult> {
  const qualities = { 'high-quality': 92, balanced: 82, smallest: 62 } as const
  return batch(files, async (file) => {
    const format = formatFor(file)
    const pipeline = sharp(file.data).rotate()
    const data = await encode(pipeline, format, qualities[options.preset])
    return toOutput(data, outputName(file.fileName, 'compressed', format), format)
  })
}

export async function resizeImages(files: ImageInputFile[], options: ResizeImagesOptions): Promise<ImageOperationResult> {
  return batch(files, async (file) => {
    const metadata = await sharp(file.data).metadata()
    const percentage = Math.max(1, Math.min(500, options.percentage ?? 100)) / 100
    const width = options.mode === 'percentage' ? Math.round((metadata.width ?? 1) * percentage) : options.width
    const height = options.mode === 'percentage' ? Math.round((metadata.height ?? 1) * percentage) : options.height
    if (!width && !height) throw new Error('A width or height is required')
    const format = formatFor(file)
    const pipeline = sharp(file.data).rotate().resize({
      width, height,
      fit: options.maintainAspectRatio ? options.fit : 'fill',
      withoutEnlargement: options.withoutEnlargement,
    })
    return toOutput(await encode(pipeline, format), outputName(file.fileName, 'resized', format), format)
  })
}

export async function cropImage(file: ImageInputFile, options: CropImageOptions): Promise<ImageOperationResult> {
  return batch([file], async (input) => {
    const metadata = await sharp(input.data).metadata()
    if (
      !Number.isInteger(options.left) || !Number.isInteger(options.top) ||
      !Number.isInteger(options.width) || !Number.isInteger(options.height) ||
      options.left < 0 || options.top < 0 || options.width < 1 || options.height < 1 ||
      options.left + options.width > (metadata.width ?? 0) || options.top + options.height > (metadata.height ?? 0)
    ) throw new Error('Crop rectangle is outside the image bounds')
    const format = formatFor(input)
    const data = await encode(sharp(input.data).rotate().extract(options), format)
    return toOutput(data, outputName(input.fileName, 'cropped', format), format)
  })
}

export async function rotateImages(files: ImageInputFile[], options: RotateImagesOptions): Promise<ImageOperationResult> {
  return batch(files, async (file) => {
    const metadata = await sharp(file.data).metadata()
    const portrait = (metadata.height ?? 0) > (metadata.width ?? 0)
    const applies = options.applyTo === 'all' || (options.applyTo === 'portrait' ? portrait : !portrait)
    const format = formatFor(file)
    let pipeline = sharp(file.data).rotate()
    if (applies && options.angle) pipeline = pipeline.rotate(options.angle)
    if (applies && options.flipHorizontal) pipeline = pipeline.flop()
    if (applies && options.flipVertical) pipeline = pipeline.flip()
    return toOutput(await encode(pipeline, format), outputName(file.fileName, 'rotated', format), format)
  })
}

export async function convertImages(files: ImageInputFile[], options: ConvertImagesOptions): Promise<ImageOperationResult> {
  const quality = Math.max(1, Math.min(100, options.quality))
  return batch(files, async (file) => {
    const data = await encode(sharp(file.data).rotate(), options.format, quality, options.background)
    return toOutput(data, outputName(file.fileName, 'converted', options.format), options.format)
  })
}

export async function removeImageMetadata(files: ImageInputFile[]): Promise<ImageOperationResult> {
  return batch(files, async (file) => {
    const format = formatFor(file)
    const data = await encode(sharp(file.data).rotate(), format, 90)
    return toOutput(data, outputName(file.fileName, 'clean', format), format)
  })
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
}

function gravity(position: WatermarkImagesOptions['position']): OverlayOptions['gravity'] {
  return ({ center: 'center', 'top-left': 'northwest', 'top-right': 'northeast', 'bottom-left': 'southwest', 'bottom-right': 'southeast' })[position] as OverlayOptions['gravity']
}

export async function watermarkImages(files: ImageInputFile[], options: WatermarkImagesOptions): Promise<ImageOperationResult> {
  return batch(files, async (file) => {
    const metadata = await sharp(file.data).metadata()
    const width = metadata.width ?? 1
    const markWidth = Math.max(16, Math.round(width * Math.max(0.05, Math.min(1, options.scale))))
    let watermark: Buffer
    if (options.kind === 'image' && options.image) {
      const imageError = await validateInputs([options.image])
      if (imageError) throw new Error(imageError.userMessage)
      watermark = await sharp(options.image.data).resize({ width: markWidth, withoutEnlargement: false }).ensureAlpha(options.opacity).png().toBuffer()
    } else {
      if (!options.text?.trim()) throw new Error('Watermark text is required')
      const text = escapeXml(options.text.slice(0, 100))
      watermark = Buffer.from(`<svg width="${markWidth}" height="${Math.max(48, options.fontSize * 2)}"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${options.fontSize}" fill="${escapeXml(options.color)}" fill-opacity="${options.opacity}">${text}</text></svg>`)
    }
    const overlays: OverlayOptions[] = options.repeat
      ? Array.from({ length: 9 }, (_, index) => ({ input: watermark, left: Math.round((index % 3) * width / 3), top: Math.round(Math.floor(index / 3) * (metadata.height ?? 1) / 3) }))
      : [{ input: watermark, gravity: gravity(options.position) }]
    const format = formatFor(file)
    const data = await encode(sharp(file.data).rotate().composite(overlays), format, 90)
    return toOutput(data, outputName(file.fileName, 'watermarked', format), format)
  })
}

export async function blurImageAreas(file: ImageInputFile, options: BlurImageOptions): Promise<ImageOperationResult> {
  return batch([file], async (input) => {
    if (options.areas.length === 0) throw new Error('At least one blur area is required')
    const base = sharp(input.data).rotate()
    const metadata = await base.metadata()
    const overlays: OverlayOptions[] = []
    for (const area of options.areas) {
      if (area.left < 0 || area.top < 0 || area.width < 1 || area.height < 1 || area.left + area.width > (metadata.width ?? 0) || area.top + area.height > (metadata.height ?? 0)) throw new Error('Blur area is outside the image bounds')
      let region = sharp(input.data).rotate().extract(area)
      if (options.mode === 'blur') region = region.blur(Math.max(0.3, Math.min(100, options.intensity)))
      else {
        const factor = Math.max(2, Math.round(options.intensity))
        region = region.resize(Math.max(1, Math.round(area.width / factor)), Math.max(1, Math.round(area.height / factor))).resize(area.width, area.height, { kernel: 'nearest' })
      }
      overlays.push({ input: await region.png().toBuffer(), left: area.left, top: area.top })
    }
    const format = formatFor(input)
    const data = await encode(base.composite(overlays), format, 90)
    return toOutput(data, outputName(input.fileName, options.mode === 'blur' ? 'blurred' : 'pixelated', format), format)
  })
}

function memeSvg(text: string, width: number, height: number, fontSize: number, color: string, y: number): Buffer {
  return Buffer.from(`<svg width="${width}" height="${height}"><text x="50%" y="${y}" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="${fontSize}" font-weight="700" fill="${escapeXml(color)}" stroke="#000" stroke-width="${Math.max(1, fontSize / 16)}" paint-order="stroke">${escapeXml(text.slice(0, 160).toUpperCase())}</text></svg>`)
}

export async function createMeme(file: ImageInputFile, options: MemeOptions): Promise<ImageOperationResult> {
  return batch([file], async (input) => {
    const metadata = await sharp(input.data).rotate().metadata()
    const width = metadata.width ?? 1
    const height = metadata.height ?? 1
    const band = options.placement === 'outside' ? Math.max(60, options.fontSize * 2) : 0
    let pipeline = sharp(input.data).rotate()
    if (band) pipeline = pipeline.extend({ top: band, bottom: band, background: options.background })
    const totalHeight = height + band * 2
    const overlays = [
      { input: memeSvg(options.topText, width, totalHeight, options.fontSize, options.color, band ? band * 0.7 : options.fontSize * 1.25), left: 0, top: 0 },
      { input: memeSvg(options.bottomText, width, totalHeight, options.fontSize, options.color, totalHeight - options.fontSize * 0.45), left: 0, top: 0 },
    ]
    const format = formatFor(input)
    const data = await encode(pipeline.composite(overlays), format, 92)
    return toOutput(data, outputName(input.fileName, 'meme', format), format)
  })
}

export async function adjustImages(files: ImageInputFile[], options: AdjustImagesOptions): Promise<ImageOperationResult> {
  return batch(files, async (file) => {
    const format = formatFor(file)
    let pipeline = sharp(file.data)
    if (options.autoOrient) pipeline = pipeline.rotate()
    pipeline = pipeline.modulate({ brightness: options.brightness, saturation: options.saturation })
    pipeline = pipeline.linear(options.contrast, 128 * (1 - options.contrast))
    if (options.grayscale) pipeline = pipeline.grayscale()
    if (options.sepia) pipeline = pipeline.recomb([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])
    if (options.sharpen > 0) pipeline = pipeline.sharpen({ sigma: Math.max(0.3, Math.min(10, options.sharpen)) })
    const data = await encode(pipeline, format, 90)
    return toOutput(data, outputName(file.fileName, 'adjusted', format), format)
  })
}
