import { useState } from 'react'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ToolHeader, ResultBox } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const COLOR = '#1a7a4a'

export function ExcelToPdf({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)

  async function handle() {
    setLoading(true); setResult(null)
    const r = await window.privatePdf.excelToPdf(path)
    setResult(r); setLoading(false)
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <ToolHeader
        title="Excel to PDF"
        description="Convert a .xlsx spreadsheet to PDF locally."
        hint="Each sheet is rendered as a table. Charts, conditional formatting, and complex cell styles are not supported."
        color={COLOR}
        onBack={onBack}
      />
      <DropZone accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" label="Drop a .xlsx file here" onFiles={(p, n) => { setPath(p[0]); setName(n[0]); setResult(null) }} />
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
