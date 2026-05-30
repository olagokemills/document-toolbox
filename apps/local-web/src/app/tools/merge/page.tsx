'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#e8445a'

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addFiles(incoming: File[]) {
    setError(null)
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      const deduped = incoming.filter((f) => !existing.has(f.name + f.size))
      return [...prev, ...deduped]
    })
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      files.forEach((f) => form.append('files', f))
      const res = await fetch('/api/pdf/merge', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not merge these PDFs. Your files were not uploaded anywhere.')
        return
      }
      const blob = await res.blob()
      download(blob, 'merged.pdf')
    } catch {
      setError('We could not merge these PDFs. Your files were not uploaded anywhere.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Merge PDFs</h1>
      <p className={styles.sub}>Combine multiple PDF files into one.</p>

      <DropZone
        accept=".pdf,application/pdf"
        multiple
        label="Drop PDF files here or click to browse"
        onFiles={addFiles}
      />

      {files.length > 0 && (
        <ul className={styles.fileList} aria-label="Files to merge">
          {files.map((f, i) => (
            <li key={i} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileSize}>{prettySize(f.size)}</span>
              </div>
              <div className={styles.fileActions}>
                {i > 0 && (
                  <button className={styles.iconBtn} onClick={() => moveFile(i, i - 1)} aria-label="Move up">↑</button>
                )}
                {i < files.length - 1 && (
                  <button className={styles.iconBtn} onClick={() => moveFile(i, i + 1)} aria-label="Move down">↓</button>
                )}
                <button className={styles.iconBtn} onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton
          onClick={handleMerge}
          loading={loading}
          disabled={files.length < 2}
          color={COLOR}
        >
          Merge {files.length > 0 ? `${files.length} PDFs` : 'PDFs'} →
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
