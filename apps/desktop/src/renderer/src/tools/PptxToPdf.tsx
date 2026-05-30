import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#c75c1e'

export function PptxToPdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.pptxToPdf(path)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader
        title="PowerPoint to PDF"
        description="Convert a .pptx presentation to PDF locally."
        hint="Text content and slide structure are preserved. Animations, complex graphics, and embedded media are not."
        color={COLOR}
        onBack={onBack}
      />
      <DropZone accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" label="Drop a .pptx file here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
      {name && <p className={styles.selectedFile}>{name}</p>}
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={!path} color={COLOR}>
          Convert to PDF →
        </ProcessingButton>
      </div>
    </div>
  )
}
