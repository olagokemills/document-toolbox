'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import { getPdfPageCount } from '@/lib/getPdfPageCount'
import styles from '../tool.module.css'

const COLOR = '#d94da6'

export default function DeletePagesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(incoming: File[]) {
    setError(null)
    const f = incoming[0]
    if (!f) return
    setFile(f)
    setSelected(new Set())
    try {
      setPageCount(await getPdfPageCount(f))
    } catch {
      setPageCount(0)
      setError('We could not read this PDF. The file may be corrupted, encrypted, or unsupported.')
    }
  }

  function toggle(n: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(n)) { next.delete(n) } else { next.add(n) }
      return next
    })
  }

  async function handleDelete() {
    if (!file) { setError('Please select a PDF file.'); return }
    if (selected.size === 0) { setError('Please select at least one page to delete.'); return }
    if (selected.size === pageCount) {
      setError('A PDF must contain at least one page. Please leave at least one page selected.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('pages', Array.from(selected).join(','))
      const res = await fetch('/api/pdf/delete-pages', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not process this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'deleted-pages.pdf')
    } catch {
      setError('We could not process this PDF. Your file was not uploaded anywhere.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Delete Pages</h1>
      <p className={styles.sub}>Select pages to remove, then export the rest.</p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse" onFiles={handleFiles} />

      {file && <p className={styles.selectedFile}>{file.name} · {pageCount} page{pageCount !== 1 ? 's' : ''}</p>}

      {pageCount > 0 && (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Select pages to delete ({selected.size} selected)</legend>
          <div className={styles.pageGrid}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <label key={n} className={`${styles.pageChip} ${selected.has(n) ? styles.pageChipSelected : ''}`}
                style={{ '--tool-color': COLOR } as React.CSSProperties}>
                <input type="checkbox" checked={selected.has(n)} onChange={() => toggle(n)}
                  className={styles.srOnly} aria-label={`Page ${n}`} />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleDelete} loading={loading} disabled={!file || selected.size === 0} color={COLOR}>
          Delete {selected.size > 0 ? `${selected.size} Page${selected.size !== 1 ? 's' : ''}` : 'Pages'} →
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
