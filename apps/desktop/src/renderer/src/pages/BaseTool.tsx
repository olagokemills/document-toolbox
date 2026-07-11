import type React from 'react'
import styles from '../styles/tool.module.css'
import type { IpcResult } from '../env.d'

export interface BaseToolProps {
  title: string
  description: string
  hint?: string
  color: string
  onBack: () => void
}

interface ResultBoxProps {
  result: IpcResult | null
  error: string | null
}

export function ResultBox({ result, error }: ResultBoxProps) {
  if (error) return <p className={styles.error} role="alert">{error}</p>
  if (!result) return null
  if (!result.ok) return <p className={styles.error} role="alert">{result.error}</p>
  return (
    <div className={styles.success} role="status">
      <span className={styles.successPath}>Saved: {result.fileName}</span>
      <button
        className={styles.showInFolderBtn}
        onClick={() => window.privatePdf.showSavedFile(result.savedFileHandle)}
      >
        Show in folder
      </button>
    </div>
  )
}

export function ToolHeader({
  title, description, hint, color, onBack,
}: BaseToolProps) {
  return (
    <div style={{ '--tool-color': color } as React.CSSProperties}>
      <button className={styles.back} onClick={onBack}>← Back</button>
      <h1 className={styles.heading}>{title}</h1>
      <p className={styles.sub}>{description}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
