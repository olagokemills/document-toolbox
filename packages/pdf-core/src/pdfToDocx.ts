import { PDFParse } from 'pdf-parse'
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx'
import type { PdfInputFile, ConversionResult } from '@private-pdf/shared-types'
import { validatePdfInput } from './validate'

export async function pdfToDocx(inputFile: PdfInputFile): Promise<ConversionResult> {
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

    // Split into paragraphs on blank lines, treat each line as a paragraph
    const lines = rawText.split('\n').map((l: string) => l.trim())
    const paragraphs: Paragraph[] = []

    for (const line of lines) {
      if (!line) {
        // Empty line → spacer paragraph
        paragraphs.push(new Paragraph({}))
        continue
      }
      // Heuristic: short all-caps lines are headings
      const isHeading = line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)
      paragraphs.push(
        new Paragraph({
          heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
          children: [new TextRun({ text: line, bold: isHeading })],
        }),
      )
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    })

    const buffer = await Packer.toBuffer(doc)
    return {
      status: 'success',
      fileName: `${inputFile.fileName.replace(/\.pdf$/i, '')}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: new Uint8Array(buffer),
    }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not convert this PDF to Word. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
