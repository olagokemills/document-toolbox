import { BrowserWindow } from 'electron'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

export async function htmlToPdf(
  html: string,
  pageSize: 'A4' | 'Letter' = 'A4',
): Promise<Uint8Array> {
  const tmpPath = join(tmpdir(), `ppdf-${randomUUID()}.html`)
  await writeFile(tmpPath, html, 'utf8')

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      javascript: false,
    },
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
