'use client'

import { useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import type { WatermarkPosition } from '@private-pdf/shared-types'
import styles from '../tool.module.css'

const COLOR = '#c99b14'

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [position, setPosition] = useState<WatermarkPosition>('center')
  const [opacity, setOpacity] = useState<0.1 | 0.25 | 0.5>(0.25)
  const [rotation, setRotation] = useState<0 | 45>(45)
  const [pagesMode, setPagesMode] = useState<'all' | 'custom'>('all')
  const [customPages, setCustomPages] = useState('')
  const [wmColor, setWmColor] = useState('#666666')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApply() {
    if (!file) { setError('Please select a PDF file.'); return }
    if (!text.trim()) { setError('Please enter watermark text.'); return }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('text', text)
      form.append('position', position)
      form.append('opacity', String(opacity))
      form.append('rotation', String(rotation))
      form.append('pages', pagesMode === 'all' ? 'all' : customPages)
      form.append('color', wmColor)
      const res = await fetch('/api/pdf/watermark', { method: 'POST', body: form })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'We could not add the watermark. Your file was not uploaded anywhere.')
        return
      }
      download(await res.blob(), 'watermarked.pdf')
    } catch {
      setError('We could not add the watermark. Your file was not uploaded anywhere.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page} style={{ '--tool-color': COLOR } as React.CSSProperties}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>Add Watermark</h1>
      <p className={styles.sub}>Stamp text on PDF pages.</p>

      <DropZone accept=".pdf,application/pdf" label="Drop a PDF here or click to browse" onFiles={(f) => { setError(null); setFile(f[0] ?? null) }} />
      {file && <p className={styles.selectedFile}>{file.name}</p>}

      <div className={styles.field}>
        <label htmlFor="wm-text" className={styles.label}>Watermark text</label>
        <input id="wm-text" type="text" className={styles.input} value={text}
          onChange={(e) => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL" maxLength={100} />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Position</legend>
        {(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as WatermarkPosition[]).map((p) => (
          <label key={p} className={styles.radio}>
            <input type="radio" name="position" value={p} checked={position === p} onChange={() => setPosition(p)} />
            {p.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Opacity & Rotation</legend>
        <label className={styles.label}>Opacity</label>
        {([0.1, 0.25, 0.5] as (0.1 | 0.25 | 0.5)[]).map((o) => (
          <label key={o} className={styles.radio}>
            <input type="radio" name="opacity" value={o} checked={opacity === o} onChange={() => setOpacity(o)} />
            {Math.round(o * 100)}%
          </label>
        ))}
        <label className={styles.label} style={{ marginTop: '0.5rem' }}>Angle</label>
        {([0, 45] as (0 | 45)[]).map((r) => (
          <label key={r} className={styles.radio}>
            <input type="radio" name="rotation" value={r} checked={rotation === r} onChange={() => setRotation(r)} />
            {r === 0 ? 'Horizontal' : '45° diagonal'}
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Color</legend>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {['#666666', '#000000', '#e8445a', '#2d7ef0', '#0eadb0', '#8a5ae8', '#e89a2a', '#17a65e'].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setWmColor(c)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: c,
                border: wmColor === c ? '3px solid #111' : '2px solid transparent',
                outline: wmColor === c ? '2px solid #fff' : 'none',
                outlineOffset: '-4px',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Custom
            <input
              type="color"
              value={wmColor}
              onChange={(e) => setWmColor(e.target.value)}
              style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Pages</legend>
        <label className={styles.radio}>
          <input type="radio" name="wm-pages" value="all" checked={pagesMode === 'all'} onChange={() => setPagesMode('all')} />
          All pages
        </label>
        <label className={styles.radio}>
          <input type="radio" name="wm-pages" value="custom" checked={pagesMode === 'custom'} onChange={() => setPagesMode('custom')} />
          Selected pages
        </label>
        {pagesMode === 'custom' && (
          <input type="text" className={styles.input} value={customPages}
            onChange={(e) => setCustomPages(e.target.value)} placeholder="e.g. 1, 3, 5" style={{ marginTop: '0.4rem' }} />
        )}
      </fieldset>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <ProcessingButton onClick={handleApply} loading={loading} disabled={!file} color={COLOR}>
          Apply Watermark →
        </ProcessingButton>
      </div>
    </div>
  )
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}
