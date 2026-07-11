import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { readFile, stat, writeFile } from 'fs/promises'
import { basename, extname } from 'path'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import { XMLParser } from 'fast-xml-parser'
import * as XLSX from 'xlsx'
import {
  mergePdfs,
  splitPdf,
  rotatePdfPages,
  deletePdfPages,
  extractPdfPages,
  reorderPdfPages,
  addTextWatermark,
  removePdfMetadata,
  imagesToPdf,
  lockPdf,
  unlockPdf,
  pdfToDocx,
  pdfToXlsx,
  pdfToPdfA,
} from '@private-pdf/pdf-core'
import {
  adjustImages, blurImageAreas, compressImages, convertImages, createMeme, cropImage,
  removeImageMetadata, resizeImages, rotateImages, watermarkImages,
} from '@private-pdf/image-core'
import type {
  AdjustImagesOptions,
  BlurImageOptions,
  CompressImagesOptions,
  ConvertImagesOptions,
  CropImageOptions,
  PdfInputFile,
  ImageInputFile,
  WatermarkOptions,
  LockPdfOptions,
  MemeOptions,
  ResizeImagesOptions,
  RotateImagesOptions,
  WatermarkImagesOptions,
} from '@private-pdf/shared-types'
import { FILE_LIMITS } from '@private-pdf/shared-types'
import { htmlToPdf } from './html-to-pdf'

type IpcResult = { ok: true; savedPath: string } | { ok: false; error: string }

const GENERAL_OPERATION_ERROR =
  'We could not process this file. It may be corrupted or unsupported. Your file was not uploaded anywhere.'

function safeFailure(message = GENERAL_OPERATION_ERROR): IpcResult {
  return { ok: false, error: message }
}

async function readPdfFile(filePath: string): Promise<PdfInputFile> {
  if (extname(filePath).toLowerCase() !== '.pdf') throw new Error('Invalid PDF extension')
  const data = await readFileWithinLimit(filePath, FILE_LIMITS.maxSinglePdfSizeBytes)
  return { fileName: basename(filePath), data: new Uint8Array(data) }
}

async function readImageFile(filePath: string): Promise<ImageInputFile> {
  const extension = extname(filePath).toLowerCase()
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) throw new Error('Invalid image extension')
  const data = await readFileWithinLimit(filePath, FILE_LIMITS.maxSingleImageSizeBytes)
  const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : extension === '.webp' ? 'image/webp' : 'image/png'
  return { fileName: basename(filePath), data: new Uint8Array(data), mimeType }
}

async function readFileWithinLimit(filePath: string, maxBytes: number): Promise<Buffer> {
  const info = await stat(filePath)
  if (!info.isFile() || info.size > maxBytes) throw new Error('File exceeds the supported size limit')
  return readFile(filePath)
}

async function showSaveDialog(
  win: BrowserWindow | null,
  defaultName: string,
  ext: string,
): Promise<string | null> {
  const result = await dialog.showSaveDialog(win ?? BrowserWindow.getFocusedWindow()!, {
    defaultPath: defaultName,
    filters: [{ name: ext.toUpperCase(), extensions: [ext.replace('.', '')] }],
  })
  return result.canceled ? null : result.filePath!
}

async function saveResult(
  data: Uint8Array,
  win: BrowserWindow | null,
  defaultName: string,
): Promise<IpcResult> {
  const ext = extname(defaultName)
  const savePath = await showSaveDialog(win, defaultName, ext)
  if (!savePath) return { ok: false, error: 'Cancelled.' }
  await writeFile(savePath, data)
  return { ok: true, savedPath: savePath }
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  // Renderer-only conversions receive bytes only for a file explicitly selected by the user.
  ipcMain.handle('pdf:load-for-rendering', async (_, filePath: string) => {
    const file = await readPdfFile(filePath)
    return file.data
  })

  ipcMain.handle('pdf:save-images-archive', async (_, bytes: Uint8Array) =>
    saveResult(bytes, getWindow(), 'pdf-pages.zip'))

  ipcMain.handle('pdf:save-powerpoint', async (_, bytes: Uint8Array, defaultName: string) => {
    const safeName = basename(defaultName).replace(/[^a-zA-Z0-9._ -]/g, '_')
    const outputName = safeName.toLowerCase().endsWith('.pptx') ? safeName : `${safeName}.pptx`
    return saveResult(bytes, getWindow(), outputName)
  })

  ipcMain.handle('shell:show-saved-file', async (_, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('image:process', async (_, operation: string, filePaths: string[], options: unknown, watermarkPath?: string): Promise<IpcResult> => {
    try {
      if (filePaths.length === 0 || filePaths.length > FILE_LIMITS.maxImageCount) return safeFailure('Please select between 1 and 100 images.')
      const files: ImageInputFile[] = []
      for (const filePath of filePaths) files.push(await readImageFile(filePath))
      let result
      switch (operation) {
        case 'compress': result = await compressImages(files, options as CompressImagesOptions); break
        case 'resize': result = await resizeImages(files, options as ResizeImagesOptions); break
        case 'crop': result = await cropImage(files[0], options as CropImageOptions); break
        case 'rotate': result = await rotateImages(files, options as RotateImagesOptions); break
        case 'convert': result = await convertImages(files, options as ConvertImagesOptions); break
        case 'remove-metadata': result = await removeImageMetadata(files); break
        case 'blur': result = await blurImageAreas(files[0], options as BlurImageOptions); break
        case 'meme': result = await createMeme(files[0], options as MemeOptions); break
        case 'adjust': result = await adjustImages(files, options as AdjustImagesOptions); break
        case 'watermark': {
          const watermarkOptions = { ...(options as WatermarkImagesOptions) }
          if (watermarkPath) watermarkOptions.image = await readImageFile(watermarkPath)
          result = await watermarkImages(files, watermarkOptions)
          break
        }
        default: return safeFailure('Unknown image operation.')
      }
      if (result.status !== 'success' || !result.files) return safeFailure(result.error?.userMessage)
      if (result.files.length === 1) return saveResult(result.files[0].data, getWindow(), result.files[0].fileName)
      const archive = new JSZip()
      for (const output of result.files) archive.file(output.fileName, output.data)
      return saveResult(await archive.generateAsync({ type: 'uint8array' }), getWindow(), 'processed-images.zip')
    } catch {
      return safeFailure()
    }
  })

  // ── PDF Operations ────────────────────────────────────────────────────────

  ipcMain.handle('pdf:merge', async (_, filePaths: string[]): Promise<IpcResult> => {
    try {
      const files = await Promise.all(filePaths.map(readPdfFile))
      const result = await mergePdfs(files)
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'Merge failed.' }
      return saveResult(result.data, getWindow(), 'merged.pdf')
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle(
    'pdf:split',
    async (_, filePath: string, ranges: string): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const parsedRanges = ranges
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
          .map((r) => {
            const [s, e] = r.split('-').map(Number)
            return { start: s, end: e ?? s }
          })
        const result = await splitPdf(file, {
          mode: parsedRanges.length ? 'ranges' : 'every-page',
          ranges: parsedRanges.length ? parsedRanges : undefined,
        })
        if (result.status !== 'success' || !result.files)
          return { ok: false, error: result.error?.userMessage ?? 'Split failed.' }

        const zip = new JSZip()
        for (const f of result.files) zip.file(f.fileName, f.data)
        const zipData = await zip.generateAsync({ type: 'uint8array' })
        return saveResult(zipData, getWindow(), 'split-pages.zip')
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle(
    'pdf:rotate',
    async (_, filePath: string, degrees: 90 | 180 | 270, pages: number[] | 'all'): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const result = await rotatePdfPages(file, { degrees, pages })
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Rotate failed.' }
        const name = basename(filePath, extname(filePath)) + '-rotated.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle(
    'pdf:delete-pages',
    async (_, filePath: string, pagesToDelete: number[]): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const result = await deletePdfPages(file, { pagesToDelete })
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Delete failed.' }
        const name = basename(filePath, extname(filePath)) + '-edited.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle(
    'pdf:extract-pages',
    async (_, filePath: string, rangesStr: string): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const ranges = rangesStr
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
          .map((r) => {
            const [s, e] = r.split('-').map(Number)
            return { start: s, end: e ?? s }
          })
        const result = await extractPdfPages(file, { ranges })
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Extract failed.' }
        const name = basename(filePath, extname(filePath)) + '-extracted.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle(
    'pdf:reorder',
    async (_, filePath: string, pageOrder: number[]): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const result = await reorderPdfPages(file, { pageOrder })
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Reorder failed.' }
        const name = basename(filePath, extname(filePath)) + '-reordered.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle(
    'pdf:watermark',
    async (_, filePath: string, opts: WatermarkOptions): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const result = await addTextWatermark(file, opts)
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Watermark failed.' }
        const name = basename(filePath, extname(filePath)) + '-watermarked.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle('pdf:remove-metadata', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const file = await readPdfFile(filePath)
      const result = await removePdfMetadata(file)
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'Remove metadata failed.' }
      const name = basename(filePath, extname(filePath)) + '-clean.pdf'
      return saveResult(result.data, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle('pdf:images-to-pdf', async (_, filePaths: string[]): Promise<IpcResult> => {
    try {
      if (filePaths.length > FILE_LIMITS.maxImageCount) {
        return safeFailure(`You can convert up to ${FILE_LIMITS.maxImageCount} images at once.`)
      }
      const imageStats = await Promise.all(filePaths.map((filePath) => stat(filePath)))
      const totalImageSize = imageStats.reduce((sum, info) => sum + info.size, 0)
      if (totalImageSize > FILE_LIMITS.maxTotalImageSizeBytes) {
        return safeFailure('The total size of the selected images is too large. Try fewer or smaller images.')
      }
      const files: ImageInputFile[] = await Promise.all(
        filePaths.map(async (p) => {
          const ext = extname(p).toLowerCase()
          if (!['.jpg', '.jpeg', '.png'].includes(ext)) throw new Error('Invalid image extension')
          const data = new Uint8Array(
            await readFileWithinLimit(p, FILE_LIMITS.maxSingleImageSizeBytes),
          )
          const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
          return { fileName: basename(p), data, mimeType }
        }),
      )
      const result = await imagesToPdf(files, { pageSize: 'fit' })
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'Images to PDF failed.' }
      return saveResult(result.data, getWindow(), 'images.pdf')
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle(
    'pdf:lock',
    async (_, filePath: string, opts: LockPdfOptions): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const result = await lockPdf(file, opts)
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Lock failed.' }
        const name = basename(filePath, extname(filePath)) + '-locked.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  ipcMain.handle(
    'pdf:unlock',
    async (_, filePath: string, password: string): Promise<IpcResult> => {
      try {
        const file = await readPdfFile(filePath)
        const result = await unlockPdf(file, { password })
        if (result.status !== 'success' || !result.data)
          return { ok: false, error: result.error?.userMessage ?? 'Unlock failed.' }
        const name = basename(filePath, extname(filePath)) + '-unlocked.pdf'
        return saveResult(result.data, getWindow(), name)
      } catch {
        return safeFailure()
      }
    },
  )

  // ── Conversion: to PDF ────────────────────────────────────────────────────

  ipcMain.handle('convert:html-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const html = (await readFileWithinLimit(filePath, FILE_LIMITS.maxSinglePdfSizeBytes)).toString('utf8')
      const pdf = await htmlToPdf(html)
      const name = basename(filePath, extname(filePath)) + '.pdf'
      return saveResult(pdf, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle('convert:word-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const docxData = await readFileWithinLimit(filePath, FILE_LIMITS.maxSinglePdfSizeBytes)
      const { value: html } = await mammoth.convertToHtml({ buffer: docxData })
      const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: Georgia, serif; max-width: 780px; margin: 40px auto; line-height: 1.6; color: #1a1a1a; }
        h1,h2,h3 { font-family: system-ui, sans-serif; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        td,th { border: 1px solid #ccc; padding: 6px 10px; }
      </style></head><body>${html}</body></html>`
      const pdf = await htmlToPdf(styledHtml)
      const name = basename(filePath, extname(filePath)) + '.pdf'
      return saveResult(pdf, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle('convert:excel-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const data = await readFileWithinLimit(filePath, FILE_LIMITS.maxSinglePdfSizeBytes)
      const wb = XLSX.read(data, { type: 'buffer' })
      const sheets = wb.SheetNames.map((name) => {
        const html = XLSX.utils.sheet_to_html(wb.Sheets[name])
        return `<section><h2 style="font-size:14px;margin:0 0 8px">${name}</h2>${html}</section>`
      })
      const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { font-family: system-ui, sans-serif; font-size: 11px; color: #1a1a1a; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
        td,th { border: 1px solid #ccc; padding: 3px 6px; }
        th { background: #f0f0f0; font-weight: 600; }
        section { page-break-after: always; padding: 16px; }
      </style></head><body>${sheets.join('')}</body></html>`
      const pdf = await htmlToPdf(styledHtml, 'Letter')
      const name = basename(filePath, extname(filePath)) + '.pdf'
      return saveResult(pdf, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle('convert:pptx-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const data = await readFileWithinLimit(filePath, FILE_LIMITS.maxSinglePdfSizeBytes)
      const zip = await JSZip.loadAsync(data)
      const slideFiles = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)![0])
          const numB = parseInt(b.match(/\d+/)![0])
          return numA - numB
        })

      const parser = new XMLParser({ ignoreAttributes: false })

      function collectText(node: unknown): string[] {
        if (typeof node === 'string') return [node]
        if (Array.isArray(node)) return node.flatMap(collectText)
        if (node && typeof node === 'object') {
          return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
            k === '#text' || k === 'a:t' ? [String(v)] : collectText(v),
          )
        }
        return []
      }

      const slideHtmls = await Promise.all(
        slideFiles.map(async (sf) => {
          const xml = await zip.file(sf)!.async('string')
          const parsed = parser.parse(xml)
          const texts = collectText(parsed).map((t) => t.trim()).filter(Boolean)
          const [title, ...body] = texts
          return `<section>
            ${title ? `<h1>${title}</h1>` : ''}
            ${body.length ? `<ul>${body.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
          </section>`
        }),
      )

      const styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        @page { size: A4 landscape; margin: 30mm 25mm; }
        body { font-family: system-ui, sans-serif; color: #1a1a1a; }
        section { min-height: 90vh; border-left: 6px solid #2d7ef0; padding: 20px 30px; page-break-after: always; }
        h1 { font-size: 22px; margin: 0 0 16px; }
        ul { margin: 0; padding-left: 20px; line-height: 1.7; font-size: 14px; }
      </style></head><body>${slideHtmls.join('')}</body></html>`
      const pdf = await htmlToPdf(styledHtml, 'A4')
      const name = basename(filePath, extname(filePath)) + '.pdf'
      return saveResult(pdf, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  // ── Conversion: from PDF ──────────────────────────────────────────────────

  ipcMain.handle('convert:pdf-to-word', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const file = await readPdfFile(filePath)
      const result = await pdfToDocx(file)
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'PDF to Word failed.' }
      const name = basename(filePath, extname(filePath)) + '.docx'
      return saveResult(result.data, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle('convert:pdf-to-excel', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const file = await readPdfFile(filePath)
      const result = await pdfToXlsx(file)
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'PDF to Excel failed.' }
      const name = basename(filePath, extname(filePath)) + '.xlsx'
      return saveResult(result.data, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })

  ipcMain.handle('convert:pdf-to-pdfa', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const file = await readPdfFile(filePath)
      const result = await pdfToPdfA(file)
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'PDF to PDF/A failed.' }
      const name = basename(filePath, extname(filePath)) + '-pdfa.pdf'
      return saveResult(result.data, getWindow(), name)
    } catch {
      return safeFailure()
    }
  })
}
