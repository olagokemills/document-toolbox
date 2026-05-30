import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { htmlToPdf } from '@/lib/htmlToPdf'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'Please select a .pptx file.' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      return Response.json({ error: 'Only .pptx files are supported.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Collect slide files in order
    const slideEntries = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0')
        const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0')
        return na - nb
      })

    if (slideEntries.length === 0) {
      return Response.json({ error: 'No slides found in this PowerPoint file.' }, { status: 422 })
    }

    const parser = new XMLParser({ ignoreAttributes: true, textNodeName: '_text' })

    const slideDivs = await Promise.all(
      slideEntries.map(async (entry) => {
        const xml = await zip.files[entry].async('text')
        const parsed = parser.parse(xml)

        // Walk the parsed object to collect all text nodes
        const texts: string[] = []
        function collectText(obj: unknown): void {
          if (typeof obj === 'string' && obj.trim()) {
            texts.push(obj.trim())
          } else if (typeof obj === 'number') {
            texts.push(String(obj))
          } else if (Array.isArray(obj)) {
            obj.forEach(collectText)
          } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(collectText)
          }
        }
        collectText(parsed)

        const escaped = texts.map((t) => t.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        const [title, ...rest] = escaped
        return `<div class="slide">
  ${title ? `<h1>${title}</h1>` : ''}
  ${rest.length ? `<ul>${rest.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
</div>`
      }),
    )

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 2cm; }
  body { font-family: Arial, sans-serif; margin: 0; }
  .slide {
    width: 100%; min-height: 100vh; page-break-after: always;
    display: flex; flex-direction: column; justify-content: center;
    padding: 3cm 4cm; box-sizing: border-box;
    background: #fff; border-left: 6px solid #2d7ef0;
  }
  h1 { font-size: 22pt; margin: 0 0 1em; color: #111; }
  ul { font-size: 13pt; line-height: 1.8; color: #333; padding-left: 1.5em; }
  li { margin-bottom: 0.3em; }
</style></head><body>${slideDivs.join('\n')}</body></html>`

    const pdf = await htmlToPdf(html, 'A4')
    const baseName = file.name.replace(/\.pptx$/i, '')
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    })
  } catch (err) {
    console.error('pptx-to-pdf error', err)
    return Response.json(
      { error: 'We could not convert this PowerPoint file. Your file was not uploaded anywhere.' },
      { status: 500 },
    )
  }
}
