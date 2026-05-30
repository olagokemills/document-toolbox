import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { reorderPdfPages } from '../reorder'
import { deletePdfPages } from '../deletePages'
import { extractPdfPages } from '../extract'
import { imagesToPdf } from '../imagesToPdf'
import { addTextWatermark } from '../watermark'
import { removePdfMetadata } from '../removeMetadata'
import { makePdf, makeInvalidPdf, makeWrongExtension, pageCount } from './fixtures'

// ── Tiny 1x1 PNG in memory for image tests ───────────────────────────────────
// Minimal valid PNG: 1×1 red pixel
const MINI_PNG = new Uint8Array([
  0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, // PNG signature
  0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52, // IHDR chunk length + type
  0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // width=1, height=1
  0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bit depth, colour type, CRC...
  0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41, // IDAT chunk
  0x54,0x08,0xd7,0x63,0xf8,0xcf,0xc0,0x00,
  0x00,0x00,0x02,0x00,0x01,0xe2,0x21,0xbc,
  0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4e, // IEND chunk
  0x44,0xae,0x42,0x60,0x82,
])

const PNG_FILE = { data: MINI_PNG, fileName: 'red.png', mimeType: 'image/png' as const }

// ── reorderPdfPages ───────────────────────────────────────────────────────────

describe('reorderPdfPages', () => {
  it('reverses page order', async () => {
    const input = await makePdf(3)
    const result = await reorderPdfPages(input, { pageOrder: [3, 2, 1] })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(3)
    expect(result.fileName).toBe('reordered.pdf')
  })

  it('rejects out-of-range page number', async () => {
    const input = await makePdf(3)
    const result = await reorderPdfPages(input, { pageOrder: [1, 5] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })

  it('rejects empty order', async () => {
    const input = await makePdf(2)
    const result = await reorderPdfPages(input, { pageOrder: [] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('NO_PAGES_SELECTED')
  })

  it('rejects invalid PDF', async () => {
    const result = await reorderPdfPages(makeInvalidPdf(), { pageOrder: [1] })
    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('PDF_PARSE_FAILED')
  })

  it('rejects wrong extension', async () => {
    const result = await reorderPdfPages(makeWrongExtension(), { pageOrder: [1] })
    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_FILE_TYPE')
  })
})

// ── deletePdfPages ────────────────────────────────────────────────────────────

describe('deletePdfPages', () => {
  it('deletes specified pages', async () => {
    const input = await makePdf(5)
    const result = await deletePdfPages(input, { pagesToDelete: [2, 4] })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(3)
  })

  it('rejects deleting all pages', async () => {
    const input = await makePdf(2)
    const result = await deletePdfPages(input, { pagesToDelete: [1, 2] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('ALL_PAGES_DELETED')
  })

  it('rejects empty selection', async () => {
    const input = await makePdf(2)
    const result = await deletePdfPages(input, { pagesToDelete: [] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('NO_PAGES_SELECTED')
  })

  it('rejects invalid PDF', async () => {
    const result = await deletePdfPages(makeInvalidPdf(), { pagesToDelete: [1] })
    expect(result.status).toBe('error')
  })
})

// ── extractPdfPages ───────────────────────────────────────────────────────────

describe('extractPdfPages', () => {
  it('extracts specified page range', async () => {
    const input = await makePdf(6)
    const result = await extractPdfPages(input, { ranges: [{ start: 2, end: 4 }] })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(3)
  })

  it('extracts multiple ranges, deduplicating pages', async () => {
    const input = await makePdf(6)
    const result = await extractPdfPages(input, {
      ranges: [{ start: 1, end: 2 }, { start: 5, end: 6 }],
    })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(4)
  })

  it('rejects out-of-bounds range', async () => {
    const input = await makePdf(3)
    const result = await extractPdfPages(input, { ranges: [{ start: 2, end: 10 }] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })

  it('rejects empty ranges', async () => {
    const input = await makePdf(3)
    const result = await extractPdfPages(input, { ranges: [] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })
})

// ── imagesToPdf ───────────────────────────────────────────────────────────────

describe('imagesToPdf', () => {
  it('converts a PNG to a single-page PDF', async () => {
    const result = await imagesToPdf([PNG_FILE], { pageSize: 'fit' })

    expect(result.status).toBe('success')
    expect(result.mimeType).toBe('application/pdf')
    expect(await pageCount(result.data!)).toBe(1)
  })

  it('converts multiple images to a multi-page PDF', async () => {
    const result = await imagesToPdf([PNG_FILE, PNG_FILE, PNG_FILE], { pageSize: 'a4-portrait' })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(3)
  })

  it('rejects empty image list', async () => {
    const result = await imagesToPdf([], { pageSize: 'fit' })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('NO_PAGES_SELECTED')
  })

  it('rejects unsupported image type', async () => {
    const bad = { data: MINI_PNG, fileName: 'img.webp', mimeType: 'image/webp' as never }
    const result = await imagesToPdf([bad], { pageSize: 'fit' })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_FILE_TYPE')
  })
})

// ── addTextWatermark ──────────────────────────────────────────────────────────

describe('addTextWatermark', () => {
  it('watermarks all pages', async () => {
    const input = await makePdf(3)
    const result = await addTextWatermark(input, {
      text: 'CONFIDENTIAL',
      position: 'center',
      opacity: 0.25,
      rotation: 45,
      pages: 'all',
      color: '#666666',
    })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(3)
    expect(result.fileName).toBe('watermarked.pdf')
  })

  it('watermarks selected pages only', async () => {
    const input = await makePdf(4)
    const result = await addTextWatermark(input, {
      text: 'DRAFT',
      position: 'top-right',
      opacity: 0.1,
      rotation: 0,
      pages: [1, 3],
      color: '#e8445a',
    })

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(4)
  })

  it('rejects empty text', async () => {
    const input = await makePdf(1)
    const result = await addTextWatermark(input, {
      text: '   ',
      position: 'center',
      opacity: 0.25,
      rotation: 0,
      pages: 'all',
      color: '#666666',
    })

    expect(result.status).toBe('error')
  })

  it('rejects invalid PDF', async () => {
    const result = await addTextWatermark(makeInvalidPdf(), {
      text: 'TEST', position: 'center', opacity: 0.25, rotation: 0, pages: 'all', color: '#666666',
    })
    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('PDF_PARSE_FAILED')
  })
})

// ── removePdfMetadata ─────────────────────────────────────────────────────────

describe('removePdfMetadata', () => {
  it('clears title and author', async () => {
    const src = await PDFDocument.create()
    src.setTitle('Secret Report')
    src.setAuthor('Jane Doe')
    src.addPage()
    const rawData = await src.save()
    const input = { data: rawData, fileName: 'doc.pdf' }

    const result = await removePdfMetadata(input)
    expect(result.status).toBe('success')

    const cleaned = await PDFDocument.load(result.data!)
    expect(cleaned.getTitle()).toBe('')
    expect(cleaned.getAuthor()).toBe('')
  })

  it('returns correct filename and mime type', async () => {
    const input = await makePdf(1)
    const result = await removePdfMetadata(input)

    expect(result.fileName).toBe('cleaned.pdf')
    expect(result.mimeType).toBe('application/pdf')
  })

  it('rejects invalid PDF', async () => {
    const result = await removePdfMetadata(makeInvalidPdf())
    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('PDF_PARSE_FAILED')
  })

  it('rejects wrong extension', async () => {
    const result = await removePdfMetadata(makeWrongExtension())
    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_FILE_TYPE')
  })
})
