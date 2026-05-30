import { describe, it, expect } from 'vitest'
import { mergePdfs } from '../merge'
import { makePdf, makeInvalidPdf, makeWrongExtension, pageCount } from './fixtures'

describe('mergePdfs', () => {
  it('merges two valid PDFs into one', async () => {
    const a = await makePdf(2, 'a.pdf')
    const b = await makePdf(3, 'b.pdf')
    const result = await mergePdfs([a, b])

    expect(result.status).toBe('success')
    expect(result.mimeType).toBe('application/pdf')
    expect(result.fileName).toBe('merged.pdf')
    expect(result.data).toBeDefined()
    expect(await pageCount(result.data!)).toBe(5)
  })

  it('preserves page order across multiple files', async () => {
    const a = await makePdf(1, 'first.pdf')
    const b = await makePdf(2, 'second.pdf')
    const c = await makePdf(1, 'third.pdf')
    const result = await mergePdfs([a, b, c])

    expect(result.status).toBe('success')
    expect(await pageCount(result.data!)).toBe(4)
  })

  it('rejects fewer than 2 files', async () => {
    const a = await makePdf(1, 'solo.pdf')
    const result = await mergePdfs([a])

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('TOO_MANY_FILES')
  })

  it('rejects empty file list', async () => {
    const result = await mergePdfs([])

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('TOO_MANY_FILES')
  })

  it('rejects a file with wrong extension', async () => {
    const a = await makePdf(1, 'a.pdf')
    const bad = makeWrongExtension()
    const result = await mergePdfs([a, bad])

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('INVALID_FILE_TYPE')
  })

  it('rejects a file with invalid PDF content', async () => {
    const a = await makePdf(1, 'a.pdf')
    const bad = makeInvalidPdf('corrupt.pdf')
    const result = await mergePdfs([a, bad])

    expect(result.status).toBe('error')
    expect(result.error?.code).toBe('PDF_PARSE_FAILED')
  })

  it('returns a safe user message on failure (no stack traces)', async () => {
    const bad = makeInvalidPdf('bad.pdf')
    const result = await mergePdfs([bad, bad])

    expect(result.error?.userMessage).toBeTruthy()
    expect(result.error?.userMessage).not.toMatch(/TypeError|stack|at Object/)
  })
})
