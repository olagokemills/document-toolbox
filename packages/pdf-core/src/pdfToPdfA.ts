import { PDFDocument, PDFName } from 'pdf-lib'
import type { PdfInputFile, PdfOperationResult } from '@private-pdf/shared-types'
import { validatePdfInput, validatePdfPageCount } from './validate'

export async function pdfToPdfA(inputFile: PdfInputFile): Promise<PdfOperationResult> {
  try {
    const inputErr = validatePdfInput(inputFile)
    if (inputErr) return { status: 'error', error: inputErr }

    let doc: PDFDocument
    try {
      doc = await PDFDocument.load(inputFile.data, { ignoreEncryption: true })
    } catch {
      return {
        status: 'error',
        error: {
          code: 'PDF_PARSE_FAILED',
          userMessage: 'We could not read this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere.',
        },
      }
    }

    const pageCountErr = validatePdfPageCount(doc.getPageCount())
    if (pageCountErr) return { status: 'error', error: pageCountErr }

    // Apply best-effort PDF/A-1b metadata
    const now = new Date().toISOString()
    doc.setCreator('PrivatePDF Local')
    doc.setProducer('PrivatePDF Local')
    doc.setCreationDate(new Date())
    doc.setModificationDate(new Date())

    // Embed XMP metadata packet with PDF/A-1b conformance markers
    const xmp = [
      `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>`,
      `<x:xmpmeta xmlns:x="adobe:ns:meta/">`,
      `  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`,
      `    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">`,
      `      <pdfaid:part>1</pdfaid:part>`,
      `      <pdfaid:conformance>B</pdfaid:conformance>`,
      `    </rdf:Description>`,
      `    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
      `      <dc:format>application/pdf</dc:format>`,
      `    </rdf:Description>`,
      `    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">`,
      `      <xmp:CreateDate>${now}</xmp:CreateDate>`,
      `      <xmp:ModifyDate>${now}</xmp:ModifyDate>`,
      `      <xmp:MetadataDate>${now}</xmp:MetadataDate>`,
      `      <xmp:CreatorTool>PrivatePDF Local</xmp:CreatorTool>`,
      `    </rdf:Description>`,
      `  </rdf:RDF>`,
      `</x:xmpmeta>`,
      `<?xpacket end="w"?>`,
    ].join('\n')

    const xmpBytes = new TextEncoder().encode(xmp)
    const metadataStream = doc.context.stream(xmpBytes, {
      Type: 'Metadata',
      Subtype: 'XML',
      Length: xmpBytes.length,
    })
    const metadataRef = doc.context.register(metadataStream)
    doc.catalog.set(PDFName.of('Metadata'), metadataRef)

    const data = await doc.save()
    return {
      status: 'success',
      fileName: 'document.pdfa.pdf',
      mimeType: 'application/pdf',
      data,
    }
  } catch (err) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        userMessage: 'We could not convert this PDF to PDF/A. Your file was not uploaded anywhere.',
        developerMessage: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
