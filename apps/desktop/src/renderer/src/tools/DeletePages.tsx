import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#d94da6'

export function DeletePages({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [pagesStr, setPagesStr] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const pagesToDelete = pagesStr.split(',').map((p) => parseInt(p.trim())).filter(Boolean)
    const r = await window.privatePdf.deletePdfPages(path, pagesToDelete)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="Delete Pages" description="Remove selected pages from a PDF." color={COLOR} onBack={onBack} />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}
      <div className={styles.field}>
        <label className={styles.label}>Pages to delete</label>
        <input className={styles.input} placeholder="e.g. 2, 4, 6-8" value={pagesStr} onChange={(e) => setPagesStr(e.target.value)} />
      </div>
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path || !pagesStr.trim()} color={COLOR}>
          Delete Pages →
        </ProcessingButton>
      </div>
    </div>
  )
}
