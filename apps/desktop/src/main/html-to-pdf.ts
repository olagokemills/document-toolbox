import { BrowserWindow, session } from 'electron'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { pathToFileURL } from 'url'

export async function htmlToPdf(
  html: string,
  pageSize: 'A4' | 'Letter' = 'A4',
): Promise<Uint8Array> {
  const operationId = randomUUID()
  const tmpPath = join(tmpdir(), `ppdf-${operationId}.html`)
  await writeFile(tmpPath, html, 'utf8')

  const isolatedSession = session.fromPartition(`private-pdf-html-${operationId}`)
  const documentUrl = pathToFileURL(tmpPath).toString()
  isolatedSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    callback({ cancel: details.url !== documentUrl })
  })

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      javascript: false,
      partition: `private-pdf-html-${operationId}`,
    },
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== documentUrl) event.preventDefault()
  })

  try {
    await win.loadFile(tmpPath)
    const buffer = await win.webContents.printToPDF({
      pageSize,
      printBackground: true,
    })
    return new Uint8Array(buffer)
  } finally {
    win.destroy()
    await unlink(tmpPath).catch(() => {})
  }
}
