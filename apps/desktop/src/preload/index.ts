import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { WatermarkOptions, LockPdfOptions } from '@private-pdf/shared-types'

export type IpcResult = { ok: true; savedPath: string } | { ok: false; error: string }

const privatePdf = {
  // ── Utilities ──────────────────────────────────────────────────────────

  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  showInFolder: (filePath: string): void => {
    ipcRenderer.invoke('shell:show-in-folder', filePath)
  },

  // ── Dialogs ────────────────────────────────────────────────────────────

  selectFiles: (opts: {
    multiple?: boolean
    filters?: { name: string; extensions: string[] }[]
  }): Promise<string[]> => ipcRenderer.invoke('dialog:open-files', opts),

  saveFile: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:save-file', defaultName),

  // ── File IO ────────────────────────────────────────────────────────────

  readFile: (filePath: string): Promise<Uint8Array> =>
    ipcRenderer.invoke('fs:read-file', filePath),

  saveBytes: (bytes: Uint8Array, defaultName: string): Promise<IpcResult> =>
    ipcRenderer.invoke('fs:save-bytes', bytes, defaultName),

  // ── PDF Operations ─────────────────────────────────────────────────────

  mergePdfs: (filePaths: string[]): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:merge', filePaths),

  splitPdf: (filePath: string, ranges: string): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:split', filePath, ranges),

  rotatePdf: (filePath: string, degrees: 90 | 180 | 270, pages: number[] | 'all'): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:rotate', filePath, degrees, pages),

  deletePdfPages: (filePath: string, pagesToDelete: number[]): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:delete-pages', filePath, pagesToDelete),

  extractPdfPages: (filePath: string, ranges: string): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:extract-pages', filePath, ranges),

  reorderPdfPages: (filePath: string, pageOrder: number[]): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:reorder', filePath, pageOrder),

  watermarkPdf: (filePath: string, opts: WatermarkOptions): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:watermark', filePath, opts),

  removePdfMetadata: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:remove-metadata', filePath),

  imagesToPdf: (filePaths: string[]): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:images-to-pdf', filePaths),

  lockPdf: (filePath: string, opts: LockPdfOptions): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:lock', filePath, opts),

  unlockPdf: (filePath: string, password: string): Promise<IpcResult> =>
    ipcRenderer.invoke('pdf:unlock', filePath, password),

  // ── Conversions: to PDF ────────────────────────────────────────────────

  htmlToPdf: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:html-to-pdf', filePath),

  wordToPdf: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:word-to-pdf', filePath),

  excelToPdf: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:excel-to-pdf', filePath),

  pptxToPdf: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:pptx-to-pdf', filePath),

  // ── Conversions: from PDF ──────────────────────────────────────────────

  pdfToWord: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:pdf-to-word', filePath),

  pdfToExcel: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:pdf-to-excel', filePath),

  pdfToPdfa: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('convert:pdf-to-pdfa', filePath),
}

contextBridge.exposeInMainWorld('privatePdf', privatePdf)

export type PrivatePdfApi = typeof privatePdf
