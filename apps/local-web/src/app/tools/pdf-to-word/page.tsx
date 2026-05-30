'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#2b6cbf'

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/pdf/pdf-to-docx', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not convert this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), file.name.replace(/\.pdf$/i, '.docx'))
    } catch {
      setError('We could not convert this PDF. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>PDF to Word</h1>
      <p className={styles.sub}>Extract text from a PDF into an editable Word document.</p>
      <p className={styles.hint}>
        Note: This extracts text content only. The original layout, images, and formatting are not replicated. Works best with text-based PDFs — scanned image PDFs are not supported.
      </p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleConvert} loading={loading} disabled={!file} color={COLOR}>
          Convert to Word →
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
