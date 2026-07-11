import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#8a5ae8'

export function PdfToImages({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [quality, setQuality] = useState<0.75 | 0.9>(0.9)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null); setProgress('')
    try {
      const bytes = await window.privatePdf.loadPdfForRendering(path)

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
      const numPages = pdfDoc.numPages
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const canvas = document.createElement('canvas')

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Rendering page ${i} of ${numPages}…`)
        const page = await pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        canvas.width = viewport.width
        canvas.height = viewport.height
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvas, viewport } as any).promise
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
        const ext = format === 'jpg' ? 'jpg' : 'png'
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), mimeType, format === 'jpg' ? quality : undefined)
        )
        zip.file(`page-${i}.${ext}`, await blob.arrayBuffer())
      }

      setProgress('Packing ZIP…')
      const zipBytes = await zip.generateAsync({ type: 'uint8array' })
      setProgress('')
      const r = await window.privatePdf.savePdfImagesArchive(zipBytes)
      setResult(r)
    } catch {
      setResult({ ok: false, error: 'Could not convert this PDF to images. The file may be corrupted or unsupported.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="PDF to Images" description="Export each PDF page as PNG or JPG. Processed entirely on your device." color={COLOR} onBack={onBack} />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Output format</legend>
        {(['png', 'jpg'] as const).map((f) => (
          <label key={f} className={styles.radio}>
            <input type="radio" name="fmt" checked={format === f} onChange={() => setFormat(f)} /> {f.toUpperCase()}
          </label>
        ))}
        {format === 'jpg' && (
          <>
            <label className={styles.label} style={{ marginTop: '0.5rem' }}>JPEG quality</label>
            {([0.75, 0.9] as const).map((q) => (
              <label key={q} className={styles.radio}>
                <input type="radio" name="quality" checked={quality === q} onChange={() => setQuality(q)} />
                {q === 0.75 ? 'Standard (75%)' : 'High (90%)'}
              </label>
            ))}
          </>
        )}
      </fieldset>

      {progress && <p className={styles.selectedFile} aria-live="polite">{progress}</p>}
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path} color={COLOR}>
          Convert to Images →
        </ProcessingButton>
      </div>
    </div>
  )
}
