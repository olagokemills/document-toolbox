'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#6b4fa8'

export default function PdfToPdfAPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/pdf/pdf-to-pdfa', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not convert this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), file.name.replace(/\.pdf$/i, '.pdfa.pdf'))
    } catch {
      setError('We could not convert this PDF. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>PDF to PDF/A</h1>
      <p className={styles.sub}>Convert a PDF to PDF/A-1b format for long-term archiving.</p>
      <p className={styles.hint}>
        PDF/A embeds fonts and adds archival metadata so the document can be reliably reproduced in future software.
        For certified archival use, validate the output with a PDF/A validator such as veraPDF (free, open source).
      </p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleConvert} loading={loading} disabled={!file} color={COLOR}>
          Convert to PDF/A →
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
