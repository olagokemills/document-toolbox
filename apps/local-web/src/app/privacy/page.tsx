import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Privacy — PrivatePDF Local',
}

export default function PrivacyPage() {
  return (
    <article className={styles.article}>
      <h1>Privacy</h1>

      <p>
        PrivatePDF Local is designed so your files never leave your device. Here is what
        that means in practice.
      </p>

      <h2>No file uploads</h2>
      <p>
        PDF processing happens locally using code that runs inside your browser or on your
        own machine. Your files are never sent to any server.
      </p>

      <h2>No account required</h2>
      <p>
        There is no signup, login, or user account of any kind. The app does not know who
        you are.
      </p>

      <h2>No document history</h2>
      <p>
        The app does not store the files you process, the filenames, or any record of what
        you have done. When you close the browser tab, nothing is retained.
      </p>

      <h2>No analytics or telemetry</h2>
      <p>
        Version 1 includes no analytics, usage tracking, crash reporting, or telemetry of
        any kind. No data about your usage is collected or transmitted.
      </p>

      <h2>No external services for PDF operations</h2>
      <p>
        All 10 PDF tools (merge, split, rotate, and so on) run locally. The app does not
        call any external PDF API or cloud conversion service.
      </p>

      <h2>What the app may do in future versions</h2>
      <p>
        If update checking is ever added, it will be optional, disabled by default, and
        will never include your file contents, filenames, or document metadata.
      </p>

      <hr />

      <p className={styles.summary}>
        <strong>Summary:</strong> Your files stay on your device. No uploads. No accounts.
        No document tracking. No external PDF processing.
      </p>
    </article>
  )
}
