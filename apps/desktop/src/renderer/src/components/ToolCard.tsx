import type { ToolId } from '../App'
import styles from './ToolCard.module.css'

interface Props {
  toolId: ToolId
  title: string
  description: string
  color: string
  icon: React.ReactNode
  onNavigate: (id: ToolId) => void
}

export function ToolCard({ toolId, title, description, color, icon, onNavigate }: Props) {
  return (
    <button
      className={styles.card}
      style={{ '--card-color': color } as React.CSSProperties}
      onClick={() => onNavigate(toolId)}
    >
      <span className={styles.icon} style={{ color }}>{icon}</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.desc}>{description}</span>
    </button>
  )
}
