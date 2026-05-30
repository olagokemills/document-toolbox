'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import type { ImagePageSize } from '@private-pdf/shared-types'
import styles from '../tool.module.css'

const COLOR = '#e89a2a'

function prettySize(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function ImagesToPdfPage() {
  const [images, setImages] = useState<File[]>([])
  const [pageSize, setPageSize] = useState<ImagePageSize>('fit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addImages(incoming: File[]) {
    setError(null)
    setImages((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size))
      return [...prev, ...incoming.filter((f) => !existing.has(f.name + f.size))]
    })
  }

  function move(from: number, to: number) {
    setImages((prev) => { const n = [...prev]; const [i] = n.splice(from, 1); n.splice(to, 0, i); return n })
  }

  async function handleConvert() {
    if (images.length === 0) { setError('Please add at least one image.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      images.forEach((f) => form.append('images', f))
      form.append('pageSize', pageSize)
      const res = await fetch('/api/pdf/images-to-pdf', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not convert these images. Your files were not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'images.pdf')
    } catch {
      setError('We could not convert these images. Your files were not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Images to PDF</h1>
      <p className={styles.sub}>Convert JPG or PNG images into a PDF.</p>

      <DropZone accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple label="Drop images here or click to browse" onFiles={addImages} />

      {images.length > 0 && (
        <ul className={styles.fileList} aria-label="Images to convert">
          {images.map((f, i) => (
            <li key={i} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileSize}>{prettySize(f.size)}</span>
              </div>
              <div className={styles.fileActions}>
                {i > 0 && <button className={styles.iconBtn} onClick={() => move(i, i - 1)} aria-label="Move up">↑</button>}
                {i < images.length - 1 && <button className={styles.iconBtn} onClick={() => move(i, i + 1)} aria-label="Move down">↓</button>}
                <button className={styles.iconBtn} onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Page size</legend>
        {([['fit', 'Fit image to page'], ['a4-portrait', 'A4 Portrait'], ['a4-landscape', 'A4 Landscape']] as [ImagePageSize, string][]).map(([val, label]) => (
          <label key={val} className={styles.radio}>
            <input type="radio" name="pageSize" value={val} checked={pageSize === val} onChange={() => setPageSize(val)} />
            {label}
          </label>
        ))}
      </fieldset>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleConvert} loading={loading} disabled={images.length === 0} color={COLOR}>
          Convert {images.length > 0 ? `${images.length} Image${images.length !== 1 ? 's' : ''}` : 'Images'} to PDF →
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
