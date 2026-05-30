'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../tool.module.css'

const COLOR = '#dc2626'

export default function LockPdfPage() {
  const [file, setFile] = useState<File | null>(null)
  const [userPassword, setUserPassword] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [allowPrinting, setAllowPrinting] = useState(true)
  const [allowCopying, setAllowCopying] = useState(false)
  const [showOwner, setShowOwner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLock() {
    if (!file) { setError('Please select a PDF file.'); return }
    if (!userPassword.trim()) { setError('Please enter a password.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('userPassword', userPassword)
      if (ownerPassword.trim()) form.append('ownerPassword', ownerPassword)
      form.append('allowPrinting', String(allowPrinting))
      form.append('allowCopying', String(allowCopying))
      const res = await fetch('/api/pdf/lock', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not lock this PDF. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'locked.pdf')
    } catch {
      setError('We could not lock this PDF. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Lock PDF</h1>
      <p className={styles.sub}>Add password protection to a PDF.</p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse"
        onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}

      <div className={styles.field}>
        <label htmlFor="user-pw" className={styles.label}>Password to open</label>
        <input id="user-pw" type="password" className={styles.input}
          value={userPassword} onChange={(e) => setUserPassword(e.target.value)}
          placeholder="Enter a password" autoComplete="new-password" />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Permissions</legend>
        <label className={styles.radio}>
          <input type="checkbox" checked={allowPrinting} onChange={(e) => setAllowPrinting(e.target.checked)} />
          Allow printing
        </label>
        <label className={styles.radio}>
          <input type="checkbox" checked={allowCopying} onChange={(e) => setAllowCopying(e.target.checked)} />
          Allow copying text
        </label>
      </fieldset>

      <div className={styles.field}>
        <button type="button" className={styles.linkButton} onClick={() => setShowOwner((v) => !v)}>
          {showOwner ? '− Hide' : '+ Set'} separate owner password (advanced)
        </button>
        {showOwner && (
          <>
            <label htmlFor="owner-pw" className={styles.label} style={{ marginTop: '0.5rem' }}>Owner password</label>
            <input id="owner-pw" type="password" className={styles.input}
              value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Admin password (optional)" autoComplete="new-password" />
            <p className={styles.hint}>The owner password lets someone edit permissions without knowing the user password.</p>
          </>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleLock} loading={loading} disabled={!file} color={COLOR}>
          Lock PDF →
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
