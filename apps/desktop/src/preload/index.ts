import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  AdjustImagesOptions, BlurImageOptions, CompressImagesOptions, ConvertImagesOptions,
  CropImageOptions, LockPdfOptions, MemeOptions, ResizeImagesOptions,
  RotateImagesOptions, WatermarkImagesOptions, WatermarkOptions,
} from '@private-pdf/shared-types'

interface RawIpcSuccess { ok: true; savedPath: string }
interface RawIpcFailure { ok: false; error: string }
type RawIpcResult = RawIpcSuccess | RawIpcFailure

export type IpcResult =
  | { ok: true; savedFileHandle: string; fileName: string }
  | RawIpcFailure

const filePaths = new Map<string, string>()
let nextHandle = 0

function storePath(filePath: string): string {
  const handle = `file-${++nextHandle}`
  filePaths.set(handle, filePath)
  return handle
}

function resolvePath(handle: string): string {
  const filePath = filePaths.get(handle)
  if (!filePath) throw new Error('The selected file is no longer available. Please select it again.')
  return filePath
}

function fileNameFromPath(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? 'output'
}

async function invokeOperation(channel: string, ...args: unknown[]): Promise<IpcResult> {
  const result = await ipcRenderer.invoke(channel, ...args) as RawIpcResult
  if (!result.ok) return result

  return {
    ok: true,
    savedFileHandle: storePath(result.savedPath),
    fileName: fileNameFromPath(result.savedPath),
  }
}

function imageOperation(operation: string, handles: string[], options: unknown, watermarkHandle?: string): Promise<IpcResult> {
  return invokeOperation('image:process', operation, handles.map(resolvePath), options, watermarkHandle ? resolvePath(watermarkHandle) : undefined)
}

const privatePdf = {
  registerFile: (file: File): { handle: string; name: string } => ({
    handle: storePath(webUtils.getPathForFile(file)),
    name: file.name,
  }),

  showSavedFile: (handle: string): Promise<void> =>
    ipcRenderer.invoke('shell:show-saved-file', resolvePath(handle)),

  mergePdfs: (handles: string[]): Promise<IpcResult> =>
    invokeOperation('pdf:merge', handles.map(resolvePath)),

  splitPdf: (handle: string, ranges: string): Promise<IpcResult> =>
    invokeOperation('pdf:split', resolvePath(handle), ranges),

  rotatePdf: (handle: string, degrees: 90 | 180 | 270, pages: number[] | 'all'): Promise<IpcResult> =>
    invokeOperation('pdf:rotate', resolvePath(handle), degrees, pages),

  deletePdfPages: (handle: string, pagesToDelete: number[]): Promise<IpcResult> =>
    invokeOperation('pdf:delete-pages', resolvePath(handle), pagesToDelete),

  extractPdfPages: (handle: string, ranges: string): Promise<IpcResult> =>
    invokeOperation('pdf:extract-pages', resolvePath(handle), ranges),

  reorderPdfPages: (handle: string, pageOrder: number[]): Promise<IpcResult> =>
    invokeOperation('pdf:reorder', resolvePath(handle), pageOrder),

  watermarkPdf: (handle: string, opts: WatermarkOptions): Promise<IpcResult> =>
    invokeOperation('pdf:watermark', resolvePath(handle), opts),

  removePdfMetadata: (handle: string): Promise<IpcResult> =>
    invokeOperation('pdf:remove-metadata', resolvePath(handle)),

  imagesToPdf: (handles: string[]): Promise<IpcResult> =>
    invokeOperation('pdf:images-to-pdf', handles.map(resolvePath)),

  lockPdf: (handle: string, opts: LockPdfOptions): Promise<IpcResult> =>
    invokeOperation('pdf:lock', resolvePath(handle), opts),

  unlockPdf: (handle: string, password: string): Promise<IpcResult> =>
    invokeOperation('pdf:unlock', resolvePath(handle), password),

  htmlToPdf: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:html-to-pdf', resolvePath(handle)),

  wordToPdf: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:word-to-pdf', resolvePath(handle)),

  excelToPdf: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:excel-to-pdf', resolvePath(handle)),

  pptxToPdf: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:pptx-to-pdf', resolvePath(handle)),

  pdfToWord: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:pdf-to-word', resolvePath(handle)),

  pdfToExcel: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:pdf-to-excel', resolvePath(handle)),

  pdfToPdfa: (handle: string): Promise<IpcResult> =>
    invokeOperation('convert:pdf-to-pdfa', resolvePath(handle)),

  loadPdfForRendering: (handle: string): Promise<Uint8Array> =>
    ipcRenderer.invoke('pdf:load-for-rendering', resolvePath(handle)),

  savePdfImagesArchive: (bytes: Uint8Array): Promise<IpcResult> =>
    invokeOperation('pdf:save-images-archive', bytes),

  savePdfPowerPoint: (bytes: Uint8Array, defaultName: string): Promise<IpcResult> =>
    invokeOperation('pdf:save-powerpoint', bytes, defaultName),

  compressImages: (handles: string[], options: CompressImagesOptions): Promise<IpcResult> => imageOperation('compress', handles, options),
  resizeImages: (handles: string[], options: ResizeImagesOptions): Promise<IpcResult> => imageOperation('resize', handles, options),
  cropImage: (handle: string, options: CropImageOptions): Promise<IpcResult> => imageOperation('crop', [handle], options),
  rotateImages: (handles: string[], options: RotateImagesOptions): Promise<IpcResult> => imageOperation('rotate', handles, options),
  convertImages: (handles: string[], options: ConvertImagesOptions): Promise<IpcResult> => imageOperation('convert', handles, options),
  removeImageMetadata: (handles: string[]): Promise<IpcResult> => imageOperation('remove-metadata', handles, {}),
  watermarkImages: (handles: string[], options: WatermarkImagesOptions, watermarkHandle?: string): Promise<IpcResult> => imageOperation('watermark', handles, options, watermarkHandle),
  blurImageAreas: (handle: string, options: BlurImageOptions): Promise<IpcResult> => imageOperation('blur', [handle], options),
  createMeme: (handle: string, options: MemeOptions): Promise<IpcResult> => imageOperation('meme', [handle], options),
  adjustImages: (handles: string[], options: AdjustImagesOptions): Promise<IpcResult> => imageOperation('adjust', handles, options),
}

contextBridge.exposeInMainWorld('privatePdf', privatePdf)

export type PrivatePdfApi = typeof privatePdf
