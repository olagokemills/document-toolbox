import type { Metadata } from 'next'
import { TrustBadge } from '@/components/TrustBadge'
import './globals.css'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'PrivatePDF Local',
  description:
    'Private PDF tools that run on your device. No uploads. No accounts. No cloud processing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Decorative background blobs — purely visual, no content */}
        <div className={styles.blobTopLeft}    aria-hidden="true" />
        <div className={styles.blobTopRight}   aria-hidden="true" />
        <div className={styles.blobBottomRight} aria-hidden="true" />
        <div className={styles.blobBottomLeft} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <a href="/" className={styles.wordmark} aria-label="PrivatePDF Local home">
              <span>PrivatePDF</span>
              <span className={styles.wordmarkSuffix}>Local</span>
            </a>
            <TrustBadge />
          </div>
        </header>
        <main className={styles.main}>{children}</main>
        <footer className={styles.footer}>
          <a href="/privacy">Privacy</a>
          <span aria-hidden="true">·</span>
          <span>No uploads. No accounts. No cloud.</span>
        </footer>
      </body>
    </html>
  )
}
