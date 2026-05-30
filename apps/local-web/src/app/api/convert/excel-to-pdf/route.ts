import * as XLSX from 'xlsx'
import { htmlToPdf } from '@/lib/htmlToPdf'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a .xlsx file.' }, { status: 400 })
    }
    if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
      return Response.json({ error: 'Only .xlsx and .xls files are supported.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })

    let allHtml = ''
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const tableHtml = XLSX.utils.sheet_to_html(ws, { header: '', footer: '' })
      allHtml += `<h2>${sheetName}</h2>${tableHtml}<div style="page-break-after:always"></div>`
    }

    const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 9pt; margin: 1.5cm; }
  h2 { font-size: 12pt; margin: 0 0 0.5em; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
  td, th { border: 1px solid #ccc; padding: 3px 6px; font-size: 9pt; }
  tr:nth-child(even) { background: #f5f5f5; }
</style></head><body>${allHtml}</body></html>`

    const pdf = await htmlToPdf(styledHtml, 'A4')
    const baseName = file.name.replace(/\.(xlsx|xls)$/i, '')
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    })
  } catch (err) {
    console.error('excel-to-pdf error', err)
    return Response.json(
      { error: 'We could not convert this spreadsheet. Your file was not uploaded anywhere.' },
      { status: 500 },
    )
  }
}
