'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#e87d2a'

export default function ReorderPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [order, setOrder] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(incoming: File[]) {
    setError(null)
    const f = incoming[0]
    if (!f) return
    setFile(f)
    // Count pages by reading PDF locally
    try {
      const buf = await f.arrayBuffer()
      const text = new Uint8Array(buf)
      // Quick page count heuristic from PDF structure
      const str = new TextDecoder('latin1').decode(text)
      const matches = str.match(/\/Type\s*\/Page[^s]/g)
      const count = matches ? matches.length : 0
      const pages = count > 0 ? count : 1
      setPageCount(pages)
      setOrder(Array.from({ length: pages }, (_, i) => i + 1))
    } catch {
      setPageCount(0)
      setOrder([])
    }
  }

  function move(from: number, to: number) {
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  async function handleReorder() {
    if (!file) { setError('Please select a PDF file.'); return }
    if (order.length === 0) { setError('No pages to reorder.'); return }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('order', order.join(','))
      const res = await fetch('/api/pdf/reorder', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not reorder this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'reordered.pdf')
    } catch {
      setError('We could not reorder this PDF. Your file was not uploaded anywhere.')
    } finally {
      setLoading(false)
    }
  }

  const isOriginalOrder = order.every((n, i) => n === i + 1)

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Reorder Pages</h1>
      <p className={styles.sub}>Drag pages into a new order using the arrows.</p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse" onFiles={handleFiles} />

      {file && <p className={styles.selectedFile}>{file.name} · {pageCount} page{pageCount !== 1 ? 's' : ''}</p>}

      {order.length > 0 && (
        <ul className={styles.fileList} aria-label="Page order">
          {order.map((pageNum, idx) => (
            <li key={idx} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>Page {pageNum}</span>
                {pageNum !== idx + 1 && (
                  <span className={styles.fileSize}>was page {pageNum}</span>
                )}
              </div>
              <div className={styles.fileActions}>
                {idx > 0 && <button className={styles.iconBtn} onClick={() => move(idx, idx - 1)} aria-label="Move up">↑</button>}
                {idx < order.length - 1 && <button className={styles.iconBtn} onClick={() => move(idx, idx + 1)} aria-label="Move down">↓</button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleReorder} loading={loading} disabled={!file || isOriginalOrder} color={COLOR}>
          Save Reordered PDF →
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
