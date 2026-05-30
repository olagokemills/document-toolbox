import { PDFParse } from 'pdf-parse'
import * as XLSX from 'xlsx'
import type { PdfInputFile, ConversionResult } from '@private-pdf/shared-types'
import { validatePdfInput } from './validate'

export async function pdfToXlsx(inputFile: PdfInputFile): Promise<ConversionResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    let rawText: string
    try {
      const parser = new PDFParse({ data: inputFile.data })
      const result = await parser.getText()
      rawText = result.text ?? ''
      await parser.destroy()
    } catch {
      return {
        status: 'error',
        error: {
          code: 'PDF_PARSE_FAILED',
          userMessage:
            'We could not extract text from this PDF. It may be image-based, encrypted, or corrupted. Your file was not uploaded anywhere.',
        },
      }
    }
    if (!rawText.trim()) {
      return {
        status: 'error',
        error: {
          code: 'OPERATION_FAILED',
          userMessage:
            'No text was found in this PDF. It may be image-based (scanned). OCR is not supported. Your file was not uploaded anywhere.',
        },
      }
    }

    // Split lines; treat whitespace-separated columns as cells
    const lines = rawText.split('\n').filter((l: string) => l.trim())
    const rows = lines.map((line: string) => {
      // Split on 2+ consecutive spaces (common PDF table column separator)
      return line.trim().split(/\s{2,}/).map((cell: string) => cell.trim())
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted')

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return {
      status: 'success',
      fileName: `${inputFile.fileName.replace(/\.pdf$/i, '')}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data: new Uint8Array(xlsxBuffer),
    }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not convert this PDF to Excel. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
