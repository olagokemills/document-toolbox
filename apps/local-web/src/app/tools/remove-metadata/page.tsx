'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#17a65e'

export default function RemoveMetadataPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClean() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/pdf/remove-metadata', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not clean this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'cleaned.pdf')
    } catch {
      setError('We could not clean this PDF. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Remove Metadata</h1>
      <p className={styles.sub}>Strip author, title, creation date, and other common metadata fields.</p>

      <div className={styles.fieldset} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        <strong style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--color-text)' }}>What gets removed</strong>
        Title · Author · Subject · Keywords · Creator · Producer · Creation date · Modification date
        <br /><br />
        <em>Note: This removes common visible metadata fields. It may not remove every embedded trace from every PDF structure.</em>
      </div>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse" onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleClean} loading={loading} disabled={!file} color={COLOR}>
          Remove Metadata →
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
