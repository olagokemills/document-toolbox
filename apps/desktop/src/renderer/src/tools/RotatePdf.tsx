import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#0eadb0'

export function RotatePdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [angle, setAngle] = useState<90 | 180 | 270>(90)
  const [pagesMode, setPagesMode] = useState<'all' | 'custom'>('all')
  const [pagesStr, setPagesStr] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const pages = pagesMode === 'all' ? 'all' : pagesStr.split(',').map((p) => parseInt(p.trim())).filter(Boolean)
    const r = await window.privatePdf.rotatePdf(path, angle, pages)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="Rotate Pages" description="Rotate all or selected pages by 90°, 180°, or 270°." color={COLOR} onBack={onBack} />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Rotation</legend>
        {([90, 180, 270] as const).map((a) => (
          <label key={a} className={styles.radio}>
            <input type="radio" name="angle" checked={angle === a} onChange={() => setAngle(a)} /> {a}°
          </label>
        ))}
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Pages</legend>
        <label className={styles.radio}><input type="radio" name="pages" checked={pagesMode === 'all'} onChange={() => setPagesMode('all')} /> All pages</label>
        <label className={styles.radio}><input type="radio" name="pages" checked={pagesMode === 'custom'} onChange={() => setPagesMode('custom')} /> Specific pages</label>
        {pagesMode === 'custom' && (
          <input className={styles.input} style={{ marginTop: 8 }} placeholder="e.g. 1, 3, 5-7" value={pagesStr} onChange={(e) => setPagesStr(e.target.value)} />
        )}
      </fieldset>
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path} color={COLOR}>
          Rotate Pages →
        </ProcessingButton>
      </div>
    </div>
  )
}
