'use client'

import { useState, useMemo } from 'react'
import { ToolCard } from '@/components/ToolCard'
import {
  IconMerge, IconSplit, IconReorder, IconDeletePages, IconRotate, IconExtract,
  IconImagesToPDF, IconPDFToImages, IconWatermark, IconRemoveMetadata,
  IconWordToPDF, IconPPTXToPDF, IconExcelToPDF, IconHTMLToPDF,
  IconPDFToJPG, IconPDFToWord, IconPDFToPPTX, IconPDFToExcel, IconPDFToPDFA,
  IconLock, IconUnlock,
} from '@/components/ToolIcon'
import styles from './page.module.css'

type Tool = { title: string; description: string; href: string; color: string; icon: React.ReactNode }

const PDF_TOOLS: Tool[] = [
  { title: 'Merge PDFs', description: 'Combine multiple PDF files into one document.', href: '/tools/merge', color: '#e8445a', icon: <IconMerge /> },
  { title: 'Split PDF', description: 'Break a PDF into multiple files by page range.', href: '/tools/split', color: '#2d7ef0', icon: <IconSplit /> },
  { title: 'Reorder Pages', description: 'Drag pages into a new order and export.', href: '/tools/reorder', color: '#e87d2a', icon: <IconReorder /> },
  { title: 'Delete Pages', description: 'Remove selected pages from a PDF.', href: '/tools/delete-pages', color: '#d94da6', icon: <IconDeletePages /> },
  { title: 'Rotate Pages', description: 'Rotate all or selected pages 90°, 180°, or 270°.', href: '/tools/rotate', color: '#0eadb0', icon: <IconRotate /> },
  { title: 'Extract Pages', description: 'Pull selected pages out into a new PDF.', href: '/tools/extract', color: '#5a5aee', icon: <IconExtract /> },
  { title: 'Images to PDF', description: 'Convert JPG or PNG images into a single PDF.', href: '/tools/images-to-pdf', color: '#e89a2a', icon: <IconImagesToPDF /> },
  { title: 'PDF to Images', description: 'Export each PDF page as PNG or JPG.', href: '/tools/pdf-to-images', color: '#8a5ae8', icon: <IconPDFToImages /> },
  { title: 'Add Watermark', description: 'Stamp text like "CONFIDENTIAL" or "DRAFT" on pages.', href: '/tools/watermark', color: '#c99b14', icon: <IconWatermark /> },
  { title: 'Remove Metadata', description: 'Strip author, title, and other metadata from a PDF.', href: '/tools/remove-metadata', color: '#17a65e', icon: <IconRemoveMetadata /> },
  { title: 'Lock PDF', description: 'Add password protection to a PDF.', href: '/tools/lock', color: '#dc2626', icon: <IconLock /> },
  { title: 'Unlock PDF', description: 'Remove password protection from a PDF you own.', href: '/tools/unlock', color: '#16a34a', icon: <IconUnlock /> },
]

const TO_PDF_TOOLS: Tool[] = [
  { title: 'Word to PDF', description: 'Convert a .docx document to PDF locally.', href: '/tools/word-to-pdf', color: '#2b6cbf', icon: <IconWordToPDF /> },
  { title: 'PowerPoint to PDF', description: 'Convert a .pptx presentation to PDF locally.', href: '/tools/pptx-to-pdf', color: '#c75c1e', icon: <IconPPTXToPDF /> },
  { title: 'Excel to PDF', description: 'Convert a .xlsx spreadsheet to PDF locally.', href: '/tools/excel-to-pdf', color: '#1a7a4a', icon: <IconExcelToPDF /> },
  { title: 'HTML to PDF', description: 'Convert a local HTML file to PDF locally.', href: '/tools/html-to-pdf', color: '#9333ea', icon: <IconHTMLToPDF /> },
]

const FROM_PDF_TOOLS: Tool[] = [
  { title: 'PDF to JPG', description: 'Export each PDF page as a JPEG or PNG image.', href: '/tools/pdf-to-images', color: '#8a5ae8', icon: <IconPDFToJPG /> },
  { title: 'PDF to Word', description: 'Extract text from a PDF into an editable .docx.', href: '/tools/pdf-to-word', color: '#2b6cbf', icon: <IconPDFToWord /> },
  { title: 'PDF to PowerPoint', description: 'Convert each PDF page to an image slide in .pptx.', href: '/tools/pdf-to-pptx', color: '#c75c1e', icon: <IconPDFToPPTX /> },
  { title: 'PDF to Excel', description: 'Extract table data from a PDF into a .xlsx spreadsheet.', href: '/tools/pdf-to-excel', color: '#1a7a4a', icon: <IconPDFToExcel /> },
  { title: 'PDF to PDF/A', description: 'Convert to PDF/A-1b format for long-term archiving.', href: '/tools/pdf-to-pdfa', color: '#6b4fa8', icon: <IconPDFToPDFA /> },
]

const IMAGE_TOOLS: Tool[] = [
  { title: 'Compress Images', description: 'Reduce JPG, PNG, and WebP file sizes.', href: '/tools/image/compress', color: '#e8445a', icon: <IconImagesToPDF /> },
  { title: 'Resize Images', description: 'Resize images by pixels or percentage.', href: '/tools/image/resize', color: '#2d7ef0', icon: <IconImagesToPDF /> },
  { title: 'Crop Image', description: 'Crop an image using exact coordinates.', href: '/tools/image/crop', color: '#e87d2a', icon: <IconImagesToPDF /> },
  { title: 'Rotate & Flip', description: 'Rotate or flip images in bulk.', href: '/tools/image/rotate', color: '#0eadb0', icon: <IconImagesToPDF /> },
  { title: 'Convert Image Format', description: 'Convert between JPG, PNG, and WebP.', href: '/tools/image/convert', color: '#8a5ae8', icon: <IconImagesToPDF /> },
  { title: 'Remove Image Metadata', description: 'Remove EXIF, GPS, and camera metadata.', href: '/tools/image/remove-metadata', color: '#17a65e', icon: <IconRemoveMetadata /> },
  { title: 'Watermark Images', description: 'Apply text or image watermarks.', href: '/tools/image/watermark', color: '#c99b14', icon: <IconWatermark /> },
  { title: 'Blur or Pixelate', description: 'Hide selected areas manually.', href: '/tools/image/blur', color: '#d94da6', icon: <IconImagesToPDF /> },
  { title: 'Meme Maker', description: 'Add top and bottom captions.', href: '/tools/image/meme', color: '#c75c1e', icon: <IconImagesToPDF /> },
  { title: 'Adjust Images', description: 'Tune color, contrast, saturation, and sharpness.', href: '/tools/image/adjust', color: '#1a7a4a', icon: <IconImagesToPDF /> },
]

const ALL_SECTIONS = [
  { title: 'PDF tools', category: 'pdf', tools: PDF_TOOLS },
  { title: 'Convert to PDF', category: 'pdf', tools: TO_PDF_TOOLS },
  { title: 'Convert from PDF', category: 'pdf', tools: FROM_PDF_TOOLS },
  { title: 'Image tools', category: 'image', tools: IMAGE_TOOLS },
]

function filterTools(tools: Tool[], query: string): Tool[] {
  const q = query.toLowerCase().trim()
  if (!q) return tools
  return tools.filter(
    (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
  )
}

function ToolSection({ title, tools }: { title: string; tools: Tool[] }) {
  if (tools.length === 0) return null
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
        {title}
      </h2>
      <ul className={styles.grid} role="list">
        {tools.map((tool) => (
          <li key={tool.href}>
            <ToolCard title={tool.title} description={tool.description} href={tool.href} available color={tool.color} icon={tool.icon} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | 'pdf' | 'image'>('all')

  const filtered = useMemo(
    () => ALL_SECTIONS.filter((section) => category === 'all' || section.category === category).map((s) => ({ ...s, tools: filterTools(s.tools, query) })),
    [query, category],
  )
  const totalResults = filtered.reduce((n, s) => n + s.tools.length, 0)

  return (
    <div>
      <section className={styles.hero}>
        <h1 className={styles.heading}>Private document and image tools that run on your device.</h1>
        <p className={styles.sub}>No uploads. No accounts. No cloud processing.</p>
      </section>

      <div role="tablist" aria-label="Tool categories" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['all', 'pdf', 'image'] as const).map((value) => <button key={value} role="tab" aria-selected={category === value} onClick={() => setCategory(value)} style={{ border: '1px solid var(--color-border)', borderRadius: 999, padding: '0.45rem 0.85rem', background: category === value ? '#111' : 'var(--color-surface)', color: category === value ? '#fff' : 'var(--color-text)', cursor: 'pointer' }}>{value === 'all' ? 'All tools' : value === 'pdf' ? 'PDF tools' : 'Image tools'}</button>)}
      </div>

      <div className={styles.searchWrap}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tools"
        />
        {query && (
          <button className={styles.searchClear} onClick={() => setQuery('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {query && totalResults === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          No tools match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        filtered.map((s) => <ToolSection key={s.title} title={s.title} tools={s.tools} />)
      )}
    </div>
  )
}
