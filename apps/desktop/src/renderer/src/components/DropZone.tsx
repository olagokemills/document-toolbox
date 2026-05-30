import { useRef, useState } from 'react'
import styles from './DropZone.module.css'

interface DropZoneProps {
  accept?: string
  multiple?: boolean
  label: string
  onFiles: (paths: string[], names: string[]) => void
}

export function DropZone({ accept, multiple = false, label, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    const paths = arr.map((f) => window.privatePdf.getPathForFile(f))
    const names = arr.map((f) => f.name)
    onFiles(paths, names)
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label={label}
    >
      <span className={styles.icon}>📄</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.hint}>or click to browse</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
