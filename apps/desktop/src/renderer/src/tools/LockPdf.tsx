import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#dc2626'

export function LockPdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showOwner, setShowOwner] = useState(false)
  const [allowPrinting, setAllowPrinting] = useState(true)
  const [allowCopying, setAllowCopying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.lockPdf(path, {
      userPassword: password,
      ownerPassword: ownerPassword || undefined,
      allowPrinting,
      allowCopying,
    })
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="Lock PDF" description="Add password protection to a PDF." color={COLOR} onBack={onBack} />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="lock-pw">Password</label>
        <input id="lock-pw" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password" autoComplete="new-password" />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Permissions</legend>
        <label className={styles.checkbox}><input type="checkbox" checked={allowPrinting} onChange={(e) => setAllowPrinting(e.target.checked)} /> Allow printing</label>
        <label className={styles.checkbox}><input type="checkbox" checked={allowCopying} onChange={(e) => setAllowCopying(e.target.checked)} /> Allow copying text</label>
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <button className={styles.linkButton} onClick={() => setShowOwner(!showOwner)}>
          {showOwner ? '− Hide' : '+ Set'} owner (admin) password
        </button>
        {showOwner && (
          <div className={styles.field}>
            <label className={styles.label}>Owner password</label>
            <input type="password" className={styles.input} value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="Defaults to same as user password" autoComplete="new-password" />
          </div>
        )}
      </div>

      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path || !password.trim()} color={COLOR}>
          Lock PDF →
        </ProcessingButton>
      </div>
    </div>
  )
}
