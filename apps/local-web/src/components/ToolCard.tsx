import Link from 'next/link'
import styles from './ToolCard.module.css'

interface ToolCardProps {
  title: string
  description: string
  href: string
  available: boolean
  color: string
  icon: React.ReactNode
}

export function ToolCard({ title, description, href, available, color, icon }: ToolCardProps) {
  const card = (
    <div
      className={`${styles.card} ${!available ? styles.unavailable : ''}`}
      style={{ '--tool-color': color } as React.CSSProperties}
    >
      <div className={styles.topBar} />
      <div className={styles.iconWrap}>{icon}</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {available ? (
        <span className={styles.action}>Open →</span>
      ) : (
        <span className={styles.soon}>Coming soon</span>
      )}
    </div>
  )

  if (!available) {
    return <div aria-disabled="true" role="article">{card}</div>
  }

  return (
    <Link href={href} className={styles.link} aria-label={`Open ${title}`}>
      {card}
    </Link>
  )
}
