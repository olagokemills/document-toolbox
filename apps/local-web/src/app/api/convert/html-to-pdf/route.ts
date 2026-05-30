import { htmlToPdf } from '@/lib/htmlToPdf'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select an HTML file.' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      return Response.json({ error: 'Only .html and .htm files are supported.' }, { status: 400 })
    }

    const html = await file.text()
    const pdf = await htmlToPdf(html)
    const baseName = file.name.replace(/\.html?$/i, '')
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    })
  } catch (err) {
    console.error('html-to-pdf error', err)
    return Response.json(
      { error: 'We could not convert this HTML file. Your file was not uploaded anywhere.' },
      { status: 500 },
    )
  }
}
