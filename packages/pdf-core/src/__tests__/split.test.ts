import { describe, it, expect } from 'vitest'
import { splitPdf } from '../split'
import { makePdf, makeInvalidPdf, makeWrongExtension, pageCount } from './fixtures'

describe('splitPdf – every-page mode', () => {
  it('splits a 3-page PDF into 3 single-page files', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await splitPdf(input, { mode: 'every-page' })

    expect(result.status).toBe('success')
    expect(result.files).toHaveLength(3)
    for (const f of result.files!) {
      expect(await pageCount(f.data)).toBe(1)
      expect(f.mimeType).toBe('application/pdf')
    }
  })

  it('names files page-1.pdf, page-2.pdf, …', async () => {
    const input = await makePdf(2, 'doc.pdf')
    const result = await splitPdf(input, { mode: 'every-page' })

    expect(result.files![0].fileName).toBe('page-1.pdf')
    expect(result.files![1].fileName).toBe('page-2.pdf')
  })
})

describe('splitPdf – ranges mode', () => {
  it('splits by a single range', async () => {
    const input = await makePdf(5, 'doc.pdf')
    const result = await splitPdf(input, {
      mode: 'ranges',
      ranges: [{ start: 2, end: 4 }],
    })

    expect(result.status).toBe('success')
    expect(result.files).toHaveLength(1)
    expect(await pageCount(result.files![0].data)).toBe(3)
    expect(result.files![0].fileName).toBe('pages-2-4.pdf')
  })

  it('splits by multiple ranges', async () => {
    const input = await makePdf(6, 'doc.pdf')
    const result = await splitPdf(input, {
      mode: 'ranges',
      ranges: [
        { start: 1, end: 2 },
        { start: 5, end: 6 },
      ],
    })

    expect(result.status).toBe('success')
    expect(result.files).toHaveLength(2)
    expect(await pageCount(result.files![0].data)).toBe(2)
    expect(await pageCount(result.files![1].data)).toBe(2)
  })

  it('names single-page range correctly', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await splitPdf(input, {
      mode: 'ranges',
      ranges: [{ start: 2, end: 2 }],
    })

    expect(result.files![0].fileName).toBe('page-2.pdf')
  })

  it('rejects empty ranges array', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await splitPdf(input, { mode: 'ranges', ranges: [] })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })

  it('rejects range that exceeds page count', async () => {
    const input = await makePdf(3, 'doc.pdf')
    const result = await splitPdf(input, {
      mode: 'ranges',
      ranges: [{ start: 2, end: 10 }],
    })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })

  it('rejects range where start > end', async () => {
    const input = await makePdf(5, 'doc.pdf')
    const result = await splitPdf(input, {
      mode: 'ranges',
      ranges: [{ start: 4, end: 2 }],
    })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_PAGE_RANGE')
  })
})

describe('splitPdf – validation', () => {
  it('rejects invalid PDF content', async () => {
    const result = await splitPdf(makeInvalidPdf(), { mode: 'every-page' })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('PDF_PARSE_FAILED')
  })

  it('rejects wrong file extension', async () => {
    const result = await splitPdf(makeWrongExtension(), { mode: 'every-page' })

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_FILE_TYPE')
  })
})
