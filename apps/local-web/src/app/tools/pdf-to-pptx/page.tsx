'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#c75c1e'

export default function PdfToPptxPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true); setError(null); setProgress('')

    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString()

      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const numPages = pdfDoc.numPages

      // Dynamically import pptxgenjs (browser-compatible)
      const PptxGenJS = (await import('pptxgenjs')).default
      const pptx = new PptxGenJS()
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

        const base64 = canvas.toDataURL('image/png').split(',')[1]

        const slide = pptx.addSlide()
        slide.addImage({
          data: `data:image/png;base64,${base64}`,
          x: 0, y: 0, w: '100%', h: '100%',
        })
      }

      setProgress('Generating PowerPoint…')
      const pptxData = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
      const blob = new Blob([pptxData], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      })
      download(blob, file.name.replace(/\.pdf$/i, '.pptx'))
      setProgress('')
    } catch (err) {
      setError('We could not convert this PDF. Your file was not uploaded anywhere.')
      console.error(err)
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>PDF to PowerPoint</h1>
      <p className={styles.sub}>Convert each PDF page into a PowerPoint slide.</p>
      <p className={styles.hint}>
        Each page becomes an image slide. Slides will not have editable text — this preserves the visual appearance of each page.
      </p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}
      {progress && <p className={styles.selectedFile} aria-live="polite">{progress}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleConvert} loading={loading} disabled={!file} color={COLOR}>
          Convert to PowerPoint →
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
