import { IconShield } from './ToolIcon'
import styles from './TrustBadge.module.css'

export function TrustBadge() {
  return (
    <div className={styles.badge} role="status" aria-label="Privacy status: all processing is local">
      <IconShield className={styles.icon} />
      All processing happens on your device
    </div>
  )
}
