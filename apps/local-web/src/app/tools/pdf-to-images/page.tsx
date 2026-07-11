'use client'

import { useState, useRef } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#8a5ae8'

export default function PdfToImagesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [quality, setQuality] = useState<0.75 | 0.9>(0.9)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function handleConvert() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true); setError(null); setProgress('')

    try {
      // Dynamically import pdfjs-dist — runs in browser with native canvas
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const numPages = pdfDoc.numPages

      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const canvas = document.createElement('canvas')

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Rendering page ${i} of ${numPages}…`)
        const page = await pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: 2 }) // 2x = ~144dpi

        canvas.width = viewport.width
        canvas.height = viewport.height

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvas, viewport } as any).promise

        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
        const ext = format === 'jpg' ? 'jpg' : 'png'
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), mimeType, format === 'jpg' ? quality : undefined)
        )
        const buf = await blob.arrayBuffer()
        zip.file(`page-${i}.${ext}`, buf)
      }

      setProgress('Packing ZIP…')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      download(zipBlob, 'pdf-pages.zip')
      setProgress('')
    } catch (err) {
      setError('We could not convert this PDF to images. The file may be corrupted or unsupported. Your file was not uploaded anywhere.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>PDF to Images</h1>
      <p className={styles.sub}>Export each page as a PNG file.</p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Output format</legend>
        {(['png', 'jpg'] as const).map((f) => (
          <label key={f} className={styles.radio}>
            <input type="radio" name="fmt" value={f} checked={format === f} onChange={() => setFormat(f)} />
            {f.toUpperCase()}
          </label>
        ))}
        {format === 'jpg' && (
          <>
            <label className={styles.label} style={{ marginTop: '0.5rem' }}>JPEG quality</label>
            {([0.75, 0.9] as const).map((q) => (
              <label key={q} className={styles.radio}>
                <input type="radio" name="quality" value={q} checked={quality === q} onChange={() => setQuality(q)} />
                {q === 0.75 ? 'Standard (75%)' : 'High (90%)'}
              </label>
            ))}
          </>
        )}
      </fieldset>
      {file && <p className={styles.selectedFile}>{file.name}</p>}

      {progress && <p className={styles.selectedFile} aria-live="polite">{progress}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      {/* Hidden canvas used for rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />

      <div className={styles.actions}>
        <ProcessingButton onClick={handleConvert} loading={loading} disabled={!file} color={COLOR}>
          Convert to PNGs →
        </ProcessingButton>
      </div>
    </div>
  )
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}
