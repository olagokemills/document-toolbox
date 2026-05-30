/// <reference types="vite/client" />

import type { WatermarkOptions, LockPdfOptions } from '@private-pdf/shared-types'


export type IpcResult = { ok: true; savedPath: string } | { ok: false; error: string }

interface PrivatePdfApi {
  getPathForFile(file: File): string
  showInFolder(filePath: string): void

  selectFiles(opts: {
    multiple?: boolean
    filters?: { name: string; extensions: string[] }[]
  }): Promise<string[]>
  saveFile(defaultName: string): Promise<string | null>

  readFile(filePath: string): Promise<Uint8Array>
  saveBytes(bytes: Uint8Array, defaultName: string): Promise<IpcResult>

  mergePdfs(filePaths: string[]): Promise<IpcResult>
  splitPdf(filePath: string, ranges: string): Promise<IpcResult>
  rotatePdf(filePath: string, degrees: 90 | 180 | 270, pages: number[] | 'all'): Promise<IpcResult>
  deletePdfPages(filePath: string, pagesToDelete: number[]): Promise<IpcResult>
  extractPdfPages(filePath: string, ranges: string): Promise<IpcResult>
  reorderPdfPages(filePath: string, pageOrder: number[]): Promise<IpcResult>
  watermarkPdf(filePath: string, opts: WatermarkOptions): Promise<IpcResult>
  removePdfMetadata(filePath: string): Promise<IpcResult>
  imagesToPdf(filePaths: string[]): Promise<IpcResult>
  lockPdf(filePath: string, opts: LockPdfOptions): Promise<IpcResult>
  unlockPdf(filePath: string, password: string): Promise<IpcResult>

  htmlToPdf(filePath: string): Promise<IpcResult>
  wordToPdf(filePath: string): Promise<IpcResult>
  excelToPdf(filePath: string): Promise<IpcResult>
  pptxToPdf(filePath: string): Promise<IpcResult>

  pdfToWord(filePath: string): Promise<IpcResult>
  pdfToExcel(filePath: string): Promise<IpcResult>
  pdfToPdfa(filePath: string): Promise<IpcResult>
}

declare global {
  interface Window {
    privatePdf: PrivatePdfApi
  }
}
