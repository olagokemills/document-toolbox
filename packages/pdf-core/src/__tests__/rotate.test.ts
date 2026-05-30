import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { rotatePdfPages } from '../rotate'
import { makePdf, makeInvalidPdf, makeWrongExtension } from './fixtures'

async function getRotations(data: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(data)
  return doc.getPages().map((p) => p.getRotation().angle)
}

describe('rotatePdfPages – all pages', () => {
  it('rotates all pages 90°', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: 'all', degrees: 90 })

    expect(result.status).toBe('success')
    const rotations = await getRotations(result.data!)
    expect(rotations).toEqual([90, 90, 90])
  })

  it('rotates all pages 180°', async () => {
    const input = await makePdf(2, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: 'all', degrees: 180 })

    expect(result.status).toBe('success')
    const rotations = await getRotations(result.data!)
    expect(rotations).toEqual([180, 180])
  })

  it('rotates all pages 270°', async () => {
    const input = await makePdf(1, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: 'all', degrees: 270 })

    expect(result.status).toBe('success')
    const rotations = await getRotations(result.data!)
    expect(rotations).toEqual([270])
  })

  it('wraps rotation correctly (90 + 270 = 360 = 0°)', async () => {
    const input = await makePdf(1, 'doc.pdf')
    const step1 = await rotatePdfPages(input, { pages: 'all', degrees: 90 })
    const step2 = await rotatePdfPages(
      { data: step1.data!, fileName: 'doc.pdf' },
      { pages: 'all', degrees: 270 }
    )

    const rotations = await getRotations(step2.data!)
    expect(rotations[0]).toBe(0)
  })
})

describe('rotatePdfPages – selected pages', () => {
  it('rotates only the specified page', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: [2], degrees: 90 })

    expect(result.status).toBe('success')
    const rotations = await getRotations(result.data!)
    expect(rotations[0]).toBe(0)   // page 1 — untouched
    expect(rotations[1]).toBe(90)  // page 2 — rotated
    expect(rotations[2]).toBe(0)   // page 3 — untouched
  })

  it('rotates multiple selected pages', async () => {
    const input = await makePdf(4, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: [1, 3], degrees: 180 })

    expect(result.status).toBe('success')
    const rotations = await getRotations(result.data!)
    expect(rotations[0]).toBe(180)
    expect(rotations[1]).toBe(0)
    expect(rotations[2]).toBe(180)
    expect(rotations[3]).toBe(0)
  })

  it('rejects a page number that exceeds total pages', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: [5], degrees: 90 })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })
})

describe('rotatePdfPages – output', () => {
  it('sets correct fileName and mimeType', async () => {
    const input = await makePdf(1, 'doc.pdf')
    const result = await rotatePdfPages(input, { pages: 'all', degrees: 90 })

    expect(result.fileName).toBe('rotated.pdf')
    expect(result.mimeType).toBe('application/pdf')
  })
})

describe('rotatePdfPages – validation', () => {
  it('rejects invalid PDF content', async () => {
    const result = await rotatePdfPages(makeInvalidPdf(), { pages: 'all', degrees: 90 })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('PDF_PARSE_FAILED')
  })

  it('rejects wrong file extension', async () => {
    const result = await rotatePdfPages(makeWrongExtension(), { pages: 'all', degrees: 90 })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_FILE_TYPE')
  })
})
