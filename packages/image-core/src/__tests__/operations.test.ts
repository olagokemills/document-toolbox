import { beforeAll, describe, expect, it } from 'vitest'
import sharp from 'sharp'
import type { ImageInputFile } from '@private-pdf/shared-types'
import {
  adjustImages, blurImageAreas, compressImages, convertImages, createMeme,
  cropImage, removeImageMetadata, resizeImages, rotateImages, watermarkImages,
} from '../operations'

let jpg: ImageInputFile
let png: ImageInputFile
let webp: ImageInputFile

beforeAll(async () => {
  const pixels = { create: { width: 80, height: 60, channels: 4 as const, background: { r: 220, g: 30, b: 60, alpha: 0.6 } } }
  jpg = { fileName: 'photo.jpg', mimeType: 'image/jpeg', data: new Uint8Array(await sharp(pixels).flatten({ background: '#fff' }).jpeg().toBuffer()) }
  png = { fileName: 'graphic.png', mimeType: 'image/png', data: new Uint8Array(await sharp(pixels).png().toBuffer()) }
  webp = { fileName: 'picture.webp', mimeType: 'image/webp', data: new Uint8Array(await sharp(pixels).webp().toBuffer()) }
})

describe('image-core operations', () => {
  it('compresses a batch in order and preserves formats', async () => {
    const result = await compressImages([jpg, png, webp], { preset: 'balanced' })
    expect(result.status).toBe('success')
    expect(result.files?.map((file) => file.mimeType)).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })

  it('resizes by percentage', async () => {
    const result = await resizeImages([png], { mode: 'percentage', percentage: 50, fit: 'inside', maintainAspectRatio: true, withoutEnlargement: true })
    expect(result.files?.[0]).toMatchObject({ width: 40, height: 30 })
  })

  it('crops inside image bounds and rejects invalid bounds', async () => {
    const valid = await cropImage(jpg, { left: 10, top: 10, width: 30, height: 20 })
    const invalid = await cropImage(jpg, { left: 70, top: 0, width: 20, height: 20 })
    expect(valid.files?.[0]).toMatchObject({ width: 30, height: 20 })
    expect(invalid.status).toBe('error')
  })

  it('rotates dimensions', async () => {
    const result = await rotateImages([jpg], { angle: 90, flipHorizontal: false, flipVertical: false, applyTo: 'all' })
    expect(result.files?.[0]).toMatchObject({ width: 60, height: 80 })
  })

  it('converts transparent PNG to JPG with a background', async () => {
    const result = await convertImages([png], { format: 'jpeg', quality: 80, background: '#ffffff' })
    expect(result.files?.[0].mimeType).toBe('image/jpeg')
    expect((await sharp(result.files?.[0].data).metadata()).hasAlpha).toBe(false)
  })

  it('removes metadata while retaining dimensions', async () => {
    const tagged = { ...jpg, data: new Uint8Array(await sharp(jpg.data).withMetadata({ orientation: 1 }).jpeg().toBuffer()) }
    const result = await removeImageMetadata([tagged])
    const metadata = await sharp(result.files?.[0].data).metadata()
    expect(result.files?.[0]).toMatchObject({ width: 80, height: 60 })
    expect(metadata.exif).toBeUndefined()
  })

  it('adds a text watermark', async () => {
    const result = await watermarkImages([png], { kind: 'text', text: 'PRIVATE', position: 'center', opacity: 0.5, scale: 0.5, color: '#ffffff', fontSize: 20, repeat: false })
    expect(result.status).toBe('success')
  })

  it('blurs a selected area', async () => {
    const result = await blurImageAreas(jpg, { mode: 'blur', intensity: 5, areas: [{ left: 5, top: 5, width: 20, height: 20 }] })
    expect(result.status).toBe('success')
  })

  it('creates a meme', async () => {
    const result = await createMeme(jpg, { topText: 'TOP', bottomText: 'BOTTOM', placement: 'inside', fontSize: 18, color: '#ffffff', background: '#000000' })
    expect(result.status).toBe('success')
  })

  it('applies adjustments', async () => {
    const result = await adjustImages([webp], { brightness: 1.1, contrast: 1.1, saturation: 0.8, grayscale: false, sepia: true, sharpen: 1, autoOrient: true })
    expect(result.files?.[0].mimeType).toBe('image/webp')
  })

  it('rejects spoofed and corrupt inputs', async () => {
    const spoofed = { fileName: 'bad.jpg', mimeType: 'image/jpeg' as const, data: new Uint8Array([1, 2, 3]) }
    expect((await compressImages([spoofed], { preset: 'balanced' })).status).toBe('error')
  })
})
