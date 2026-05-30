'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#0eadb0'

type Degrees = 90 | 180 | 270

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null)
  const [degrees, setDegrees] = useState<Degrees>(90)
  const [pagesMode, setPagesMode] = useState<'all' | 'custom'>('all')
  const [customPages, setCustomPages] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFiles(incoming: File[]) {
    setError(null)
    setFile(incoming[0] ?? null)
  }

  async function handleRotate() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('degrees', String(degrees))
      form.append('pages', pagesMode === 'all' ? 'all' : customPages)
      const res = await fetch('/api/pdf/rotate', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not rotate this PDF. Your file was not uploaded anywhere.')
        return
      }
      const blob = await res.blob()
      download(blob, 'rotated.pdf')
    } catch {
      setError('We could not rotate this PDF. Your file was not uploaded anywhere.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Rotate Pages</h1>
      <p className={styles.sub}>Rotate all or selected pages.</p>

      <DropZone
        accept=".pdf,application/pdf"
        label="Drop a PDF here or click to browse"
        onFiles={handleFiles}
      />

      {file && <p className={styles.selectedFile}>{file.name} · {prettySize(file.size)}</p>}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Rotation</legend>
        {([90, 180, 270] as Degrees[]).map((d) => (
          <label key={d} className={styles.radio}>
            <input
              type="radio"
              name="degrees"
              value={d}
              checked={degrees === d}
              onChange={() => setDegrees(d)}
            />
            {d}° clockwise
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Pages</legend>
        <label className={styles.radio}>
          <input type="radio" name="pages" value="all" checked={pagesMode === 'all'} onChange={() => setPagesMode('all')} />
          All pages
        </label>
        <label className={styles.radio}>
          <input type="radio" name="pages" value="custom" checked={pagesMode === 'custom'} onChange={() => setPagesMode('custom')} />
          Selected pages
        </label>
      </fieldset>

      {pagesMode === 'custom' && (
        <div className={styles.field}>
          <label htmlFor="pages" className={styles.label}>Page numbers</label>
          <input
            id="pages"
            type="text"
            className={styles.input}
            value={customPages}
            onChange={(e) => setCustomPages(e.target.value)}
            placeholder="e.g. 1, 3, 5"
            aria-describedby="pages-hint"
          />
          <p id="pages-hint" className={styles.hint}>Comma-separated page numbers.</p>
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleRotate} loading={loading} disabled={!file} color={COLOR}>
          Rotate Pages →
        </ProcessingButton>
      </div>
    </div>
  )
}

function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
