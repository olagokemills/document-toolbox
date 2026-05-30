import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { ToolPage } from './pages/ToolPage'

export type ToolId =
  | 'merge' | 'split' | 'rotate' | 'delete-pages' | 'extract' | 'reorder'
  | 'watermark' | 'remove-metadata' | 'images-to-pdf' | 'pdf-to-images' | 'pdf-to-pptx'
  | 'lock' | 'unlock'
  | 'word-to-pdf' | 'pptx-to-pdf' | 'excel-to-pdf' | 'html-to-pdf'
  | 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-pdfa'

export default function App() {
  const [tool, setTool] = useState<ToolId | null>(null)

  return (
    <>
      <div className="blob blob-tl" aria-hidden="true" />
      <div className="blob blob-tr" aria-hidden="true" />
      <div className="blob blob-br" aria-hidden="true" />
      <div className="blob blob-bl" aria-hidden="true" />
      {tool ? (
        <ToolPage toolId={tool} onBack={() => setTool(null)} />
      ) : (
        <HomePage onNavigate={setTool} />
      )}
    </>
  )
}
