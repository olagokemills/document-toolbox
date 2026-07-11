import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = fileURLToPath(import.meta.resolve('pdfjs-dist/build/pdf.worker.min.mjs'))
const destination = join(appRoot, 'public', 'pdf.worker.min.mjs')

await mkdir(dirname(destination), { recursive: true })
await copyFile(source, destination)
