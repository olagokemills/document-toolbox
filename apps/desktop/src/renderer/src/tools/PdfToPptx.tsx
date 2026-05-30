import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#c75c1e'

export function PdfToPptx({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null); setProgress('')
    try {
      const bytes = await window.privatePdf.readFile(path)

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
      const numPages = pdfDoc.numPages

      const pptxgenjs = (await import('pptxgenjs')).default
      const pptx = new pptxgenjs()
      pptx.layout = 'LAYOUT_WIDE'

      const canvas = document.createElement('canvas')

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Rendering page ${i} of ${numPages}…`)
        const page = await pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        canvas.width = viewport.width
        canvas.height = viewport.height
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvas, viewport } as any).promise
        const dataUrl = canvas.toDataURL('image/png')
        const slide = pptx.addSlide()
        slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' })
      }

      setProgress('Generating .pptx…')
      const ab = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
      const pptxBytes = new Uint8Array(ab)
      setProgress('')
      const baseName = name.replace(/\.pdf$/i, '')
      const r = await window.privatePdf.saveBytes(pptxBytes, `${baseName}.pptx`)
      setResult(r)
    } catch {
      setResult({ ok: false, error: 'Could not convert this PDF to PowerPoint. The file may be corrupted or unsupported.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader
        title="PDF to PowerPoint"
        description="Convert each PDF page to an image slide in a .pptx file."
        hint="Each page is rendered as a full-slide image. Text is not editable in the resulting PowerPoint."
        color={COLOR}
        onBack={onBack}
      />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}
      {progress && <p className={styles.selectedFile} aria-live="polite">{progress}</p>}
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path} color={COLOR}>
          Convert to PowerPoint →
        </ProcessingButton>
      </div>
    </div>
  )
}
