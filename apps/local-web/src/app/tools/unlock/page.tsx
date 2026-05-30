'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#16a34a'

export default function UnlockPdfPage() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUnlock() {
    if (!file) { setError('Please select a PDF file.'); return }
    if (!password.trim()) { setError('Please enter the current password.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('password', password)
      const res = await fetch('/api/pdf/unlock', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not unlock this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'unlocked.pdf')
    } catch {
      setError('We could not unlock this PDF. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Unlock PDF</h1>
      <p className={styles.sub}>Remove password protection from a PDF you own.</p>
      <p className={styles.hint}>
        Supports standard PDF encryption (RC4 40-bit and 128-bit). PDFs encrypted with AES-256 (used by modern Adobe tools) may not be supported.
      </p>

      <DropZone accept=".pdf,application/pdf" label="Drop a password-protected PDF here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}

      <div className={styles.field}>
        <label htmlFor="unlock-pw" className={styles.label}>Current password</label>
        <input id="unlock-pw" type="password" className={styles.input}
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter the PDF password" autoComplete="current-password" />
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleUnlock} loading={loading} disabled={!file} color={COLOR}>
          Remove Password →
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
