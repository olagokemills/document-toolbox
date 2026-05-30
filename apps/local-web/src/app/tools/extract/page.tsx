'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#5a5aee'

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null)
  const [ranges, setRanges] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(incoming: File[]) {
    setError(null)
    setFile(incoming[0] ?? null)
  }

  async function handleExtract() {
    if (!file) { setError('Please select a PDF file.'); return }
    if (!ranges.trim()) { setError('Please enter page ranges. Example: 1-3, 5, 8-10.'); return }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('ranges', ranges)
      const res = await fetch('/api/pdf/extract', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not extract pages. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'extracted.pdf')
    } catch {
      setError('We could not extract pages. Your file was not uploaded anywhere.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Extract Pages</h1>
      <p className={styles.sub}>Pull selected pages into a new PDF.</p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse" onFiles={handleFiles} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}

      <div className={styles.field}>
        <label htmlFor="ranges" className={styles.label}>Pages to extract</label>
        <input id="ranges" type="text" className={styles.input} value={ranges}
          onChange={(e) => setRanges(e.target.value)} placeholder="e.g. 1-3, 5, 8-10"
          aria-describedby="ranges-hint" />
        <p id="ranges-hint" className={styles.hint}>Comma-separated ranges. All listed pages go into one new PDF.</p>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleExtract} loading={loading} disabled={!file} color={COLOR}>
          Extract Pages →
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
