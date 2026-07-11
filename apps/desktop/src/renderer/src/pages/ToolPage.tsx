import type { ToolId } from '../App'
import { MergePdf } from '../tools/MergePdf'
import { SplitPdf } from '../tools/SplitPdf'
import { RotatePdf } from '../tools/RotatePdf'
import { DeletePages } from '../tools/DeletePages'
import { ExtractPages } from '../tools/ExtractPages'
import { ReorderPdf } from '../tools/ReorderPdf'
import { WatermarkPdf } from '../tools/WatermarkPdf'
import { RemoveMetadata } from '../tools/RemoveMetadata'
import { ImagesToPdf } from '../tools/ImagesToPdf'
import { PdfToImages } from '../tools/PdfToImages'
import { PdfToPptx } from '../tools/PdfToPptx'
import { LockPdf } from '../tools/LockPdf'
import { UnlockPdf } from '../tools/UnlockPdf'
import { HtmlToPdf } from '../tools/HtmlToPdf'
import { WordToPdf } from '../tools/WordToPdf'
import { ExcelToPdf } from '../tools/ExcelToPdf'
import { PptxToPdf } from '../tools/PptxToPdf'
import { PdfToWord } from '../tools/PdfToWord'
import { PdfToExcel } from '../tools/PdfToExcel'
import { PdfToPdfa } from '../tools/PdfToPdfa'
import { ImageTool } from '../tools/ImageTool'

type ToolComponent = React.ComponentType<{ onBack: () => void }>

const TOOLS: Partial<Record<ToolId, ToolComponent>> = {
  merge: MergePdf,
  split: SplitPdf,
  rotate: RotatePdf,
  'delete-pages': DeletePages,
  extract: ExtractPages,
  reorder: ReorderPdf,
  watermark: WatermarkPdf,
  'remove-metadata': RemoveMetadata,
  'images-to-pdf': ImagesToPdf,
  'pdf-to-images': PdfToImages,
  'pdf-to-pptx': PdfToPptx,
  lock: LockPdf,
  unlock: UnlockPdf,
  'word-to-pdf': WordToPdf,
  'pptx-to-pdf': PptxToPdf,
  'excel-to-pdf': ExcelToPdf,
  'html-to-pdf': HtmlToPdf,
  'pdf-to-word': PdfToWord,
  'pdf-to-excel': PdfToExcel,
  'pdf-to-pdfa': PdfToPdfa,
}

interface Props { toolId: ToolId; onBack: () => void }

export function ToolPage({ toolId, onBack }: Props) {
  if (toolId.startsWith('image-')) {
    return <ImageTool operation={toolId.replace('image-', '')} onBack={onBack} />
  }
  const Component = TOOLS[toolId]
  return Component ? <Component onBack={onBack} /> : null
}
