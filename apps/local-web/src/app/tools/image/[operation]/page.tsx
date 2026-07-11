'use client'

import { useEffect, useMemo, useState } from 'react'
import { DropZone } from '@/components/DropZone'
import { ProcessingButton } from '@/components/ProcessingButton'
import styles from '../../tool.module.css'

const TOOLS: Record<string, { title: string; description: string; multiple: boolean; color: string }> = {
  compress: { title: 'Compress Images', description: 'Reduce JPG, PNG, and WebP file sizes while preserving dimensions.', multiple: true, color: '#e8445a' },
  resize: { title: 'Resize Images', description: 'Resize a batch by pixels or percentage.', multiple: true, color: '#2d7ef0' },
  crop: { title: 'Crop Image', description: 'Crop one image using exact pixel coordinates.', multiple: false, color: '#e87d2a' },
  rotate: { title: 'Rotate & Flip Images', description: 'Rotate or flip a batch of images.', multiple: true, color: '#0eadb0' },
  convert: { title: 'Convert Image Format', description: 'Convert between JPG, PNG, and WebP.', multiple: true, color: '#8a5ae8' },
  'remove-metadata': { title: 'Remove Image Metadata', description: 'Remove common EXIF, GPS, camera, and comment metadata.', multiple: true, color: '#17a65e' },
  watermark: { title: 'Watermark Images', description: 'Apply a text or image watermark to a batch.', multiple: true, color: '#c99b14' },
  blur: { title: 'Blur or Pixelate', description: 'Hide selected rectangular areas without automatic detection.', multiple: false, color: '#d94da6' },
  meme: { title: 'Meme Maker', description: 'Add top and bottom captions to an image.', multiple: false, color: '#c75c1e' },
  adjust: { title: 'Adjust Images', description: 'Apply brightness, contrast, saturation, grayscale, sepia, and sharpening.', multiple: true, color: '#1a7a4a' },
}

interface ResultSummary { fileName: string; width: number; height: number; byteSize: number }

function number(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function ImageToolPage({ params }: { params: { operation: string } }) {
  const tool = TOOLS[params.operation]
  const [files, setFiles] = useState<File[]>([])
  const [watermark, setWatermark] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ResultSummary[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFilter, setPreviewFilter] = useState('none')

  useEffect(() => {
    if (!files[0]) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(files[0])
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [files])

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files])
  if (!tool) return <div className={styles.page}><a href="/" className={styles.back}>← Back</a><h1>Image tool not found</h1></div>

  function addFiles(incoming: File[]) {
    setError(null); setResults([])
    setFiles(tool.multiple ? incoming.slice(0, 100) : incoming.slice(0, 1))
  }

  function optionsFrom(form: FormData) {
    switch (params.operation) {
      case 'compress': return { preset: form.get('preset') }
      case 'resize': return { mode: form.get('mode'), width: number(form.get('width'), 0) || undefined, height: number(form.get('height'), 0) || undefined, percentage: number(form.get('percentage'), 100), fit: form.get('fit'), maintainAspectRatio: form.get('aspect') === 'on', withoutEnlargement: form.get('noEnlarge') === 'on' }
      case 'crop': return { left: number(form.get('left'), 0), top: number(form.get('top'), 0), width: number(form.get('width'), 1), height: number(form.get('height'), 1) }
      case 'rotate': return { angle: number(form.get('angle'), 0), flipHorizontal: form.get('flipHorizontal') === 'on', flipVertical: form.get('flipVertical') === 'on', applyTo: form.get('applyTo') }
      case 'convert': return { format: form.get('format'), quality: number(form.get('quality'), 85), background: form.get('background') }
      case 'watermark': return { kind: form.get('kind'), text: form.get('text'), position: form.get('position'), opacity: number(form.get('opacity'), 0.5), scale: number(form.get('scale'), 0.3), color: form.get('color'), fontSize: number(form.get('fontSize'), 32), repeat: form.get('repeat') === 'on' }
      case 'blur': return { mode: form.get('mode'), intensity: number(form.get('intensity'), 8), areas: String(form.get('areas') ?? '').split(';').filter(Boolean).map((area) => { const [left, top, width, height] = area.split(',').map(Number); return { left, top, width, height } }) }
      case 'meme': return { topText: form.get('topText'), bottomText: form.get('bottomText'), placement: form.get('placement'), fontSize: number(form.get('fontSize'), 42), color: form.get('color'), background: form.get('background') }
      case 'adjust': return { brightness: number(form.get('brightness'), 1), contrast: number(form.get('contrast'), 1), saturation: number(form.get('saturation'), 1), grayscale: form.get('grayscale') === 'on', sepia: form.get('sepia') === 'on', sharpen: number(form.get('sharpen'), 0), autoOrient: form.get('autoOrient') === 'on' }
      default: return {}
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (files.length === 0) { setError('Please select at least one image.'); return }
    setLoading(true); setError(null); setResults([])
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 120_000)
    try {
      const values = new FormData(event.currentTarget)
      const request = new FormData()
      files.forEach((file) => request.append('images', file))
      if (watermark) request.append('watermark', watermark)
      request.append('options', JSON.stringify(optionsFrom(values)))
      const response = await fetch(`/api/image/${params.operation}`, { method: 'POST', body: request, signal: controller.signal })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? 'We could not process these images.')
      }
      const summary = response.headers.get('X-Image-Results')
      if (summary) setResults(JSON.parse(decodeURIComponent(summary)) as ResultSummary[])
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const name = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'processed-images.zip'
      download(await response.blob(), name)
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === 'AbortError' ? 'Processing took too long. Try fewer or smaller images.' : cause instanceof Error ? cause.message : 'We could not process these images.')
    } finally {
      window.clearTimeout(timeout); setLoading(false)
    }
  }

  return (
    <form className={styles.page} style={{ '--tool-color': tool.color } as React.CSSProperties} onSubmit={submit}>
      <a href="/" className={styles.back}>← Back</a>
      <h1 className={styles.heading}>{tool.title}</h1>
      <p className={styles.sub}>{tool.description}</p>
      <DropZone accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple={tool.multiple} label="Drop JPG, PNG, or WebP images here" onFiles={addFiles} />
      {files.length > 0 && <p className={styles.selectedFile}>{files.length} image{files.length === 1 ? '' : 's'} · {prettySize(totalSize)}</p>}
      {previewUrl && (!tool.multiple || params.operation === 'adjust') && <img src={previewUrl} alt="Selected image preview" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, filter: previewFilter }} />}
      <Options operation={params.operation} onWatermark={setWatermark} onPreviewFilter={setPreviewFilter} />
      {error && <p className={styles.error} role="alert">{error}</p>}
      {results.length > 0 && <div className={styles.fieldset} role="status"><strong>Processed locally</strong>{results.map((result) => <span key={result.fileName}>{result.fileName} · {result.width}×{result.height} · {prettySize(result.byteSize)}</span>)}</div>}
      <div className={styles.actions}><ProcessingButton onClick={() => undefined} loading={loading} disabled={files.length === 0} color={tool.color}>Process {files.length > 1 ? `${files.length} Images` : 'Image'} →</ProcessingButton></div>
    </form>
  )
}

function Options({ operation, onWatermark, onPreviewFilter }: { operation: string; onWatermark: (file: File | null) => void; onPreviewFilter: (filter: string) => void }) {
  const field = styles.field
  const input = styles.input
  if (operation === 'remove-metadata') return <div className={styles.fieldset}><strong>What is removed</strong><span>EXIF, GPS, camera details, comments, and other common metadata. Visible pixels and dimensions are preserved.</span><em>This may not remove every forensic trace from every file.</em></div>
  return <div className={styles.fieldset}>
    {operation === 'compress' && <label className={field}>Compression preset<select name="preset" className={input} defaultValue="balanced"><option value="high-quality">High Quality</option><option value="balanced">Balanced</option><option value="smallest">Smallest Size</option></select></label>}
    {operation === 'resize' && <><label className={field}>Mode<select name="mode" className={input}><option value="pixels">Pixels</option><option value="percentage">Percentage</option></select></label><label className={field}>Width<input name="width" type="number" min="1" className={input} defaultValue="1200" /></label><label className={field}>Height<input name="height" type="number" min="1" className={input} /></label><label className={field}>Percentage<input name="percentage" type="number" min="1" max="500" className={input} defaultValue="50" /></label><label><input name="aspect" type="checkbox" defaultChecked /> Maintain aspect ratio</label><label><input name="noEnlarge" type="checkbox" defaultChecked /> Do not enlarge smaller images</label><input name="fit" type="hidden" value="inside" /></>}
    {operation === 'crop' && <><label className={field}>Aspect ratio<select className={input} defaultValue="free" onChange={(event) => { const ratio = Number(event.target.value); const form = event.currentTarget.form; const width = form?.elements.namedItem('width') as HTMLInputElement | null; const height = form?.elements.namedItem('height') as HTMLInputElement | null; if (ratio && width && height) height.value = String(Math.max(1, Math.round(Number(width.value) / ratio))) }}><option value="free">Free</option><option value="1">1:1</option><option value="1.333333">4:3</option><option value="1.5">3:2</option><option value="1.777778">16:9</option></select></label>{['left','top','width','height'].map((name) => <label key={name} className={field}>{name[0].toUpperCase()+name.slice(1)} (px)<input name={name} type="number" min={name === 'width' || name === 'height' ? 1 : 0} className={input} defaultValue={name === 'width' ? 400 : name === 'height' ? 300 : 0} required /></label>)}</>}
    {operation === 'rotate' && <><label className={field}>Rotation<select name="angle" className={input}><option value="0">No rotation</option><option value="90">90° right</option><option value="180">180°</option><option value="270">90° left</option></select></label><label className={field}>Apply to<select name="applyTo" className={input}><option value="all">All images</option><option value="portrait">Portrait only</option><option value="landscape">Landscape only</option></select></label><label><input name="flipHorizontal" type="checkbox" /> Flip horizontally</label><label><input name="flipVertical" type="checkbox" /> Flip vertically</label></>}
    {operation === 'convert' && <><label className={field}>Output format<select name="format" className={input}><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></label><label className={field}>Quality<input name="quality" type="range" min="1" max="100" defaultValue="85" /></label><label className={field}>JPG background<input name="background" type="color" defaultValue="#ffffff" /></label></>}
    {operation === 'watermark' && <><label className={field}>Watermark type<select name="kind" className={input}><option value="text">Text</option><option value="image">Image</option></select></label><label className={field}>Text<input name="text" className={input} defaultValue="PRIVATE" maxLength={100} /></label><label className={field}>Watermark image<input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => onWatermark(event.target.files?.[0] ?? null)} /></label><label className={field}>Position<select name="position" className={input}><option value="center">Center</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label><label>Opacity <input name="opacity" type="range" min="0.1" max="1" step="0.1" defaultValue="0.5" /></label><label>Scale <input name="scale" type="range" min="0.05" max="1" step="0.05" defaultValue="0.3" /></label><label>Font size <input name="fontSize" type="number" min="8" max="200" defaultValue="32" className={input} /></label><label>Color <input name="color" type="color" defaultValue="#ffffff" /></label><label><input name="repeat" type="checkbox" /> Repeat pattern</label></>}
    {operation === 'blur' && <><label className={field}>Effect<select name="mode" className={input}><option value="blur">Blur</option><option value="pixelate">Pixelate</option></select></label><label className={field}>Areas (X,Y,width,height; one per semicolon)<input name="areas" className={input} placeholder="20,20,200,100; 300,50,80,80" required /></label><label>Intensity <input name="intensity" type="range" min="1" max="30" defaultValue="8" /></label></>}
    {operation === 'meme' && <><label className={field}>Top text<input name="topText" className={input} /></label><label className={field}>Bottom text<input name="bottomText" className={input} /></label><label className={field}>Placement<select name="placement" className={input}><option value="inside">Inside image</option><option value="outside">Outside image</option></select></label><label className={field}>Font size<input name="fontSize" type="number" min="12" max="200" defaultValue="42" className={input} /></label><label>Text color <input name="color" type="color" defaultValue="#ffffff" /></label><label>Background <input name="background" type="color" defaultValue="#000000" /></label></>}
    {operation === 'adjust' && <AdjustOptions onPreviewFilter={onPreviewFilter} />}
  </div>
}

function AdjustOptions({ onPreviewFilter }: { onPreviewFilter: (filter: string) => void }) {
  const [settings, setSettings] = useState({ brightness: 1, contrast: 1, saturation: 1, grayscale: false, sepia: false })
  function update(next: Partial<typeof settings>) {
    const value = { ...settings, ...next }; setSettings(value)
    onPreviewFilter(`brightness(${value.brightness}) contrast(${value.contrast}) saturate(${value.saturation}) grayscale(${value.grayscale ? 1 : 0}) sepia(${value.sepia ? 1 : 0})`)
  }
  return <><label>Brightness <input name="brightness" type="range" min="0.2" max="2" step="0.1" value={settings.brightness} onChange={(event) => update({ brightness: Number(event.target.value) })} /></label><label>Contrast <input name="contrast" type="range" min="0.2" max="2" step="0.1" value={settings.contrast} onChange={(event) => update({ contrast: Number(event.target.value) })} /></label><label>Saturation <input name="saturation" type="range" min="0" max="2" step="0.1" value={settings.saturation} onChange={(event) => update({ saturation: Number(event.target.value) })} /></label><label>Sharpen <input name="sharpen" type="range" min="0" max="5" step="0.2" defaultValue="0" /></label><label><input name="grayscale" type="checkbox" checked={settings.grayscale} onChange={(event) => update({ grayscale: event.target.checked })} /> Grayscale</label><label><input name="sepia" type="checkbox" checked={settings.sepia} onChange={(event) => update({ sepia: event.target.checked })} /> Sepia</label><label><input name="autoOrient" type="checkbox" defaultChecked /> Auto-orient</label></>
}

function prettySize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
