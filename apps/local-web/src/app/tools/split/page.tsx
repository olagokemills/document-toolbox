'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#2d7ef0'

type Mode = 'ranges' | 'every-page'

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('ranges')
  const [ranges, setRanges] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFiles(incoming: File[]) {
    setError(null)
    setFile(incoming[0] ?? null)
  }

  async function handleSplit() {
    if (!file) { setError('Please select a PDF file.'); return }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', mode)
      if (mode === 'ranges') form.append('ranges', ranges)
      const res = await fetch('/api/pdf/split', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not split this PDF. Your file was not uploaded anywhere.')
        return
      }
      const blob = await res.blob()
      const isZip = res.headers.get('Content-Type')?.includes('zip')
      download(blob, isZip ? 'split-pages.zip' : 'split.pdf')
    } catch {
      setError('We could not split this PDF. Your file was not uploaded anywhere.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Split PDF</h1>
      <p className={styles.sub}>Break a PDF into multiple files.</p>

      <DropZone
        accept=".pdf,application/pdf"
        label="Drop a PDF here or click to browse"
        onFiles={handleFiles}
      />

      {file && <p className={styles.selectedFile}>{file.name} · {prettySize(file.size)}</p>}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Split mode</legend>
        <label className={styles.radio}>
          <input type="radio" name="mode" value="ranges" checked={mode === 'ranges'} onChange={() => setMode('ranges')} />
          By page range
        </label>
        <label className={styles.radio}>
          <input type="radio" name="mode" value="every-page" checked={mode === 'every-page'} onChange={() => setMode('every-page')} />
          Every page into a separate PDF
        </label>
      </fieldset>

      {mode === 'ranges' && (
        <div className={styles.field}>
          <label htmlFor="ranges" className={styles.label}>Page ranges</label>
          <input
            id="ranges"
            type="text"
            className={styles.input}
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="e.g. 1-3, 5, 8-10"
            aria-describedby="ranges-hint"
          />
          <p id="ranges-hint" className={styles.hint}>Comma-separated. Each range becomes a separate PDF.</p>
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleSplit} loading={loading} disabled={!file} color={COLOR}>
          Split PDF →
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
