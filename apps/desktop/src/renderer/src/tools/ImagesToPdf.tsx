import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#e89a2a'

export function ImagesToPdf({ onBack }: { onBack: () => void }) {
  const [paths, setPaths] = useState<string[]>([])
  const [names, setNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.imagesToPdf(paths)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="Images to PDF" description="Convert JPG or PNG images into a single PDF. Pages are ordered by the order files were added." color={COLOR} onBack={onBack} />
      <DropZone accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple label="Drop image files here" onFiles={(p, n) => { setPaths(p); setNames(n); setResult(null) }} />
      {names.length > 0 && (
        <ul className={styles.selectedFiles}>
          {names.map((n, i) => <li key={i}>🖼️ {n}</li>)}
        </ul>
      )}
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={paths.length === 0} color={COLOR}>
          Create PDF →
        </ProcessingButton>
      </div>
    </div>
  )
}
