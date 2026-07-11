/// <reference types="vite/client" />

import type {
  AdjustImagesOptions, BlurImageOptions, CompressImagesOptions, ConvertImagesOptions,
  CropImageOptions, LockPdfOptions, MemeOptions, ResizeImagesOptions,
  RotateImagesOptions, WatermarkImagesOptions, WatermarkOptions,
} from '@private-pdf/shared-types'


export type IpcResult =
  | { ok: true; savedFileHandle: string; fileName: string }
  | { ok: false; error: string }

interface PrivatePdfApi {
  registerFile(file: File): { handle: string; name: string }
  showSavedFile(handle: string): Promise<void>

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

  loadPdfForRendering(handle: string): Promise<Uint8Array>
  savePdfImagesArchive(bytes: Uint8Array): Promise<IpcResult>
  savePdfPowerPoint(bytes: Uint8Array, defaultName: string): Promise<IpcResult>
  compressImages(handles: string[], options: CompressImagesOptions): Promise<IpcResult>
  resizeImages(handles: string[], options: ResizeImagesOptions): Promise<IpcResult>
  cropImage(handle: string, options: CropImageOptions): Promise<IpcResult>
  rotateImages(handles: string[], options: RotateImagesOptions): Promise<IpcResult>
  convertImages(handles: string[], options: ConvertImagesOptions): Promise<IpcResult>
  removeImageMetadata(handles: string[]): Promise<IpcResult>
  watermarkImages(handles: string[], options: WatermarkImagesOptions, watermarkHandle?: string): Promise<IpcResult>
  blurImageAreas(handle: string, options: BlurImageOptions): Promise<IpcResult>
  createMeme(handle: string, options: MemeOptions): Promise<IpcResult>
  adjustImages(handles: string[], options: AdjustImagesOptions): Promise<IpcResult>
}

declare global {
  interface Window {
    privatePdf: PrivatePdfApi
  }
}
