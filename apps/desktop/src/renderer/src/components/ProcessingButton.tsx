import styles from './ProcessingButton.module.css'

interface Props {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  color?: string
  children: React.ReactNode
}

export function ProcessingButton({ onClick, loading, disabled, color, children }: Props) {
  return (
    <button
      className={styles.btn}
      style={{ '--btn-color': color } as React.CSSProperties}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
