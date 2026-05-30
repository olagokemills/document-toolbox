import mammoth from 'mammoth'
import { htmlToPdf } from '@/lib/htmlToPdf'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a .docx file.' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return Response.json({ error: 'Only .docx files are supported.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) })

    const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; margin: 2cm 2.5cm; color: #111; }
  h1,h2,h3 { font-family: Arial, sans-serif; }
  p { margin: 0 0 0.8em; }
  ul, ol { margin: 0 0 0.8em 1.5em; }
</style></head><body>${html}</body></html>`

    const pdf = await htmlToPdf(styledHtml)
    const baseName = file.name.replace(/\.docx$/i, '')
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    })
  } catch (err) {
    console.error('word-to-pdf error', err)
    return Response.json(
      { error: 'We could not convert this Word document. Your file was not uploaded anywhere.' },
      { status: 500 },
    )
  }
}
