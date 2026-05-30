import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#16a34a'

export function UnlockPdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.unlockPdf(path, password)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader
        title="Unlock PDF"
        description="Remove password protection from a PDF you own."
        hint="Supports standard PDF encryption (RC4 40-bit and 128-bit). PDFs encrypted with AES-256 (used by modern Adobe tools) may not be supported."
        color={COLOR}
        onBack={onBack}
      />
      <DropZone accept=".pdf,application/pdf" label="Drop a password-protected PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="unlock-pw">Current password</label>
        <input id="unlock-pw" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter the PDF password" autoComplete="current-password" />
      </div>

      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path || !password.trim()} color={COLOR}>
          Remove Password →
        </ProcessingButton>
      </div>
    </div>
  )
}
