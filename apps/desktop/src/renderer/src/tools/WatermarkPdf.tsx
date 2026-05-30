import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import type { WatermarkPosition } from '@private-pdf/shared-types'
import styles from '../styles/tool.module.css'

const COLOR = '#c99b14'

const SWATCHES = ['#666666', '#1a1a1a', '#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0e7490']

export function WatermarkPdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [text, setText] = useState('CONFIDENTIAL')
  const [position, setPosition] = useState<WatermarkPosition>('center')
  const [opacity, setOpacity] = useState<0.1 | 0.25 | 0.5>(0.25)
  const [rotation, setRotation] = useState<0 | 45>(45)
  const [color, setColor] = useState('#666666')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.watermarkPdf(path, {
      text, position, opacity, rotation, pages: 'all', color,
    })
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="Add Watermark" description='Stamp text like "CONFIDENTIAL" or "DRAFT" on pages.' color={COLOR} onBack={onBack} />
      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}

      <div className={styles.field}>
        <label className={styles.label}>Watermark text</label>
        <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL" />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Position</legend>
        {(['center','top-left','top-right','bottom-left','bottom-right'] as WatermarkPosition[]).map((p) => (
          <label key={p} className={styles.radio}>
            <input type="radio" name="pos" checked={position === p} onChange={() => setPosition(p)} /> {p}
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Opacity</legend>
        {([0.1, 0.25, 0.5] as const).map((o) => (
          <label key={o} className={styles.radio}>
            <input type="radio" name="opacity" checked={opacity === o} onChange={() => setOpacity(o)} /> {(o * 100).toFixed(0)}%
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Rotation</legend>
        <label className={styles.radio}><input type="radio" name="rot" checked={rotation === 45} onChange={() => setRotation(45)} /> 45° (diagonal)</label>
        <label className={styles.radio}><input type="radio" name="rot" checked={rotation === 0} onChange={() => setRotation(0)} /> 0° (horizontal)</label>
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label}>Color</label>
        <div className={styles.swatches}>
          {SWATCHES.map((c) => (
            <button
              key={c}
              className={`${styles.swatch} ${color === c ? styles.swatchActive : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 22, height: 22, border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%' }} />
        </div>
      </div>

      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path || !text.trim()} color={COLOR}>
          Add Watermark →
        </ProcessingButton>
      </div>
    </div>
  )
}
