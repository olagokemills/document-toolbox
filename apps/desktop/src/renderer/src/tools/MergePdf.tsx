import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#e8445a'

export function MergePdf({ onBack }: { onBack: () => void }) {
  const [paths, setPaths] = useState<string[]>([])
  const [names, setNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.mergePdfs(paths)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader title="Merge PDFs" description="Combine multiple PDF files into one document." color={COLOR} onBack={onBack} />
      <DropZone accept=".pdf,application/pdf" multiple label="Drop PDF files here" onFiles={(p, n) => { setPaths(p); setNames(n); setResult(null) }} />
      {names.length > 0 && (
        <ul className={styles.selectedFiles}>
          {names.map((n, i) => <li key={i}>📄 {n}</li>)}
        </ul>
      )}
      <ResultBox result={result} error={null} />
      <div className={styles.actions}>
        <ProcessingButton onClick={handle} loading={loading} disabled={paths.length < 2} color={COLOR}>
          Merge PDFs →
        </ProcessingButton>
      </div>
    </div>
  )
}
