import { useState, useMemo } from 'react'
import { ToolCard } from '../components/ToolCard'
import {
  IconMerge, IconSplit, IconReorder, IconDeletePages, IconRotate, IconExtract,
  IconImagesToPDF, IconPDFToImages, IconWatermark, IconRemoveMetadata,
  IconWordToPDF, IconPPTXToPDF, IconExcelToPDF, IconHTMLToPDF,
  IconPDFToJPG, IconPDFToWord, IconPDFToPPTX, IconPDFToExcel, IconPDFToPDFA,
  IconLock, IconUnlock,
} from '../components/ToolIcon'
import type { ToolId } from '../App'
import styles from '../styles/home.module.css'

type Tool = { id: ToolId; title: string; description: string; color: string; icon: React.ReactNode }

const PDF_TOOLS: Tool[] = [
  { id: 'merge', title: 'Merge PDFs', description: 'Combine multiple PDF files into one document.', color: '#e8445a', icon: <IconMerge /> },
  { id: 'split', title: 'Split PDF', description: 'Break a PDF into multiple files by page range.', color: '#2d7ef0', icon: <IconSplit /> },
  { id: 'reorder', title: 'Reorder Pages', description: 'Rearrange pages into a new order and export.', color: '#e87d2a', icon: <IconReorder /> },
  { id: 'delete-pages', title: 'Delete Pages', description: 'Remove selected pages from a PDF.', color: '#d94da6', icon: <IconDeletePages /> },
  { id: 'rotate', title: 'Rotate Pages', description: 'Rotate all or selected pages 90°, 180°, or 270°.', color: '#0eadb0', icon: <IconRotate /> },
  { id: 'extract', title: 'Extract Pages', description: 'Pull selected pages out into a new PDF.', color: '#5a5aee', icon: <IconExtract /> },
  { id: 'images-to-pdf', title: 'Images to PDF', description: 'Convert JPG or PNG images into a single PDF.', color: '#e89a2a', icon: <IconImagesToPDF /> },
  { id: 'pdf-to-images', title: 'PDF to Images', description: 'Export each PDF page as PNG or JPG.', color: '#8a5ae8', icon: <IconPDFToImages /> },
  { id: 'watermark', title: 'Add Watermark', description: 'Stamp text like "CONFIDENTIAL" on pages.', color: '#c99b14', icon: <IconWatermark /> },
  { id: 'remove-metadata', title: 'Remove Metadata', description: 'Strip author, title, and other metadata from a PDF.', color: '#17a65e', icon: <IconRemoveMetadata /> },
  { id: 'lock', title: 'Lock PDF', description: 'Add password protection to a PDF.', color: '#dc2626', icon: <IconLock /> },
  { id: 'unlock', title: 'Unlock PDF', description: 'Remove password protection from a PDF you own.', color: '#16a34a', icon: <IconUnlock /> },
]

const TO_PDF_TOOLS: Tool[] = [
  { id: 'word-to-pdf', title: 'Word to PDF', description: 'Convert a .docx document to PDF locally.', color: '#2b6cbf', icon: <IconWordToPDF /> },
  { id: 'pptx-to-pdf', title: 'PowerPoint to PDF', description: 'Convert a .pptx presentation to PDF locally.', color: '#c75c1e', icon: <IconPPTXToPDF /> },
  { id: 'excel-to-pdf', title: 'Excel to PDF', description: 'Convert a .xlsx spreadsheet to PDF locally.', color: '#1a7a4a', icon: <IconExcelToPDF /> },
  { id: 'html-to-pdf', title: 'HTML to PDF', description: 'Convert a local HTML file to PDF locally.', color: '#9333ea', icon: <IconHTMLToPDF /> },
]

const FROM_PDF_TOOLS: Tool[] = [
  { id: 'pdf-to-images', title: 'PDF to JPG', description: 'Export each PDF page as a JPEG or PNG image.', color: '#8a5ae8', icon: <IconPDFToJPG /> },
  { id: 'pdf-to-word', title: 'PDF to Word', description: 'Extract text from a PDF into an editable .docx.', color: '#2b6cbf', icon: <IconPDFToWord /> },
  { id: 'pdf-to-pptx', title: 'PDF to PowerPoint', description: 'Convert each PDF page to an image slide in .pptx.', color: '#c75c1e', icon: <IconPDFToPPTX /> },
  { id: 'pdf-to-excel', title: 'PDF to Excel', description: 'Extract table data from a PDF into a .xlsx spreadsheet.', color: '#1a7a4a', icon: <IconPDFToExcel /> },
  { id: 'pdf-to-pdfa', title: 'PDF to PDF/A', description: 'Convert to PDF/A-1b format for long-term archiving.', color: '#6b4fa8', icon: <IconPDFToPDFA /> },
]

const IMAGE_TOOLS: Tool[] = [
  { id: 'image-compress', title: 'Compress Images', description: 'Reduce JPG, PNG, and WebP file sizes.', color: '#e8445a', icon: <IconImagesToPDF /> },
  { id: 'image-resize', title: 'Resize Images', description: 'Resize images by pixels or percentage.', color: '#2d7ef0', icon: <IconImagesToPDF /> },
  { id: 'image-crop', title: 'Crop Image', description: 'Crop an image using exact coordinates.', color: '#e87d2a', icon: <IconImagesToPDF /> },
  { id: 'image-rotate', title: 'Rotate & Flip', description: 'Rotate or flip images in bulk.', color: '#0eadb0', icon: <IconImagesToPDF /> },
  { id: 'image-convert', title: 'Convert Image Format', description: 'Convert between JPG, PNG, and WebP.', color: '#8a5ae8', icon: <IconImagesToPDF /> },
  { id: 'image-remove-metadata', title: 'Remove Image Metadata', description: 'Remove EXIF, GPS, and camera metadata.', color: '#17a65e', icon: <IconRemoveMetadata /> },
  { id: 'image-watermark', title: 'Watermark Images', description: 'Apply text or image watermarks.', color: '#c99b14', icon: <IconWatermark /> },
  { id: 'image-blur', title: 'Blur or Pixelate', description: 'Hide selected areas manually.', color: '#d94da6', icon: <IconImagesToPDF /> },
  { id: 'image-meme', title: 'Meme Maker', description: 'Add top and bottom captions.', color: '#c75c1e', icon: <IconImagesToPDF /> },
  { id: 'image-adjust', title: 'Adjust Images', description: 'Tune color, contrast, saturation, and sharpness.', color: '#1a7a4a', icon: <IconImagesToPDF /> },
]

const ALL_SECTIONS = [
  { title: 'PDF tools', tools: PDF_TOOLS },
  { title: 'Convert to PDF', tools: TO_PDF_TOOLS },
  { title: 'Convert from PDF', tools: FROM_PDF_TOOLS },
  { title: 'Image tools', tools: IMAGE_TOOLS },
]

function filterTools(tools: Tool[], query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return tools
  return tools.filter(
    (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
  )
}

interface Props { onNavigate: (id: ToolId) => void }

export function HomePage({ onNavigate }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => ALL_SECTIONS.map((s) => ({ ...s, tools: filterTools(s.tools, query) })),
    [query],
  )
  const total = filtered.reduce((n, s) => n + s.tools.length, 0)

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>PrivatePDF</span>
        <div className={styles.searchWrap} style={{ margin: 0, maxWidth: 260 }}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tools"
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')} aria-label="Clear">✕</button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heading}>Document and image tools that run on your device.</h1>
          <p className={styles.sub}>No uploads. No accounts. No internet required.</p>
        </section>

        {query && total === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No tools match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          filtered.map((s) =>
            s.tools.length === 0 ? null : (
              <section key={s.title} className={styles.section}>
                <h2 className={styles.sectionTitle}>{s.title}</h2>
                <ul className={styles.grid} role="list">
                  {s.tools.map((t) => (
                    <li key={t.id}>
                      <ToolCard
                        toolId={t.id}
                        title={t.title}
                        description={t.description}
                        color={t.color}
                        icon={t.icon}
                        onNavigate={onNavigate}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )
        )}
      </main>
    </div>
  )
}
