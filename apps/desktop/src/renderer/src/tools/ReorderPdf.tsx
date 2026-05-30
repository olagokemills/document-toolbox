import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#e87d2a'

export function ReorderPdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [orderStr, setOrderStr] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const pageOrder = orderStr.split(',').map((p) => parseInt(p.trim())).filter(Boolean)
    const r = await window.privatePdf.reorderPdfPages(path, pageOrder)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader
        title="Reorder Pages"
        description="Rearrange pages by specifying the new order."
        hint="Enter page numbers in the desired order separated by commas. Example: for a 4-page PDF, type '3, 1, 4, 2' to put page 3 first."
        color={COLOR}
        onBack={onBack}
      />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}
      <div className={styles.field}>
        <label className={styles.label}>New page order</label>
        <input className={styles.input} placeholder="e.g. 3, 1, 4, 2" value={orderStr} onChange={(e) => setOrderStr(e.target.value)} />
      </div>
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path || !orderStr.trim()} color={COLOR}>
          Reorder Pages →
        </ProcessingButton>
      </div>
    </div>
  )
}
