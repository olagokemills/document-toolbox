'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#9333ea'

export default function HtmlToPdfPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    if (!file) { setError('Please select an HTML file.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/convert/html-to-pdf', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not convert this file. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), file.name.replace(/\.html?$/i, '.pdf'))
    } catch {
      setError('We could not convert this file. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>HTML to PDF</h1>
      <p className={styles.sub}>Convert a local HTML file to PDF.</p>
      <p className={styles.hint}>
        Note: External fonts or images referenced in the HTML may not appear if they require an internet connection.
      </p>

      <DropZone accept=".html,.htm,text/html"
        label="Drop an .html file here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleConvert} loading={loading} disabled={!file} color={COLOR}>
          Convert to PDF →
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
