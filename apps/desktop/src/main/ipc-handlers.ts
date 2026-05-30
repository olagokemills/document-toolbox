import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
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
import type {
  PdfInputFile,
  ImageInputFile,
  WatermarkOptions,
  LockPdfOptions,
} from '@private-pdf/shared-types'
import { htmlToPdf } from './html-to-pdf'

type IpcResult = { ok: true; savedPath: string } | { ok: false; error: string }

async function readPdfFile(filePath: string): Promise<PdfInputFile> {
  const data = await readFile(filePath)
  return { fileName: basename(filePath), data: new Uint8Array(data) }
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
  // ── Dialogs ──────────────────────────────────────────────────────────────

  ipcMain.handle(
    'dialog:open-files',
    async (
      _,
      opts: {
        multiple?: boolean
        filters?: { name: string; extensions: string[] }[]
      },
    ) => {
      const result = await dialog.showOpenDialog(getWindow()!, {
        properties: opts.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
        filters: opts.filters ?? [{ name: 'All Files', extensions: ['*'] }],
      })
      return result.canceled ? [] : result.filePaths
    },
  )

  ipcMain.handle('dialog:save-file', async (_, defaultName: string) => {
    const ext = extname(defaultName)
    const result = await dialog.showSaveDialog(getWindow()!, {
      defaultPath: defaultName,
      filters: [{ name: ext.replace('.', '').toUpperCase(), extensions: [ext.replace('.', '')] }],
    })
    return result.canceled ? null : result.filePath
  })

  // ── File IO ───────────────────────────────────────────────────────────────

  ipcMain.handle('fs:read-file', async (_, filePath: string) => {
    const data = await readFile(filePath)
    return new Uint8Array(data)
  })

  ipcMain.handle('fs:save-bytes', async (_, bytes: Uint8Array, defaultName: string) => {
    return saveResult(bytes, getWindow(), defaultName)
  })

  ipcMain.handle('shell:show-in-folder', async (_, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  // ── PDF Operations ────────────────────────────────────────────────────────

  ipcMain.handle('pdf:merge', async (_, filePaths: string[]): Promise<IpcResult> => {
    try {
      const files = await Promise.all(filePaths.map(readPdfFile))
      const result = await mergePdfs(files)
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'Merge failed.' }
      return saveResult(result.data, getWindow(), 'merged.pdf')
    } catch (e) {
      return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('pdf:images-to-pdf', async (_, filePaths: string[]): Promise<IpcResult> => {
    try {
      const files: ImageInputFile[] = await Promise.all(
        filePaths.map(async (p) => {
          const data = new Uint8Array(await readFile(p))
          const ext = extname(p).toLowerCase()
          const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
          return { fileName: basename(p), data, mimeType }
        }),
      )
      const result = await imagesToPdf(files, { pageSize: 'fit' })
      if (result.status !== 'success' || !result.data)
        return { ok: false, error: result.error?.userMessage ?? 'Images to PDF failed.' }
      return saveResult(result.data, getWindow(), 'images.pdf')
    } catch (e) {
      return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
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
      } catch (e) {
        return { ok: false, error: String(e) }
      }
    },
  )

  // ── Conversion: to PDF ────────────────────────────────────────────────────

  ipcMain.handle('convert:html-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const html = await readFile(filePath, 'utf8')
      const pdf = await htmlToPdf(html)
      const name = basename(filePath, extname(filePath)) + '.pdf'
      return saveResult(pdf, getWindow(), name)
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('convert:word-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const docxData = await readFile(filePath)
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
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('convert:excel-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const data = await readFile(filePath)
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
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('convert:pptx-to-pdf', async (_, filePath: string): Promise<IpcResult> => {
    try {
      const data = await readFile(filePath)
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
    } catch (e) {
      return { ok: false, error: String(e) }
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
    } catch (e) {
      return { ok: false, error: String(e) }
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
    } catch (e) {
      return { ok: false, error: String(e) }
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
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })
}
