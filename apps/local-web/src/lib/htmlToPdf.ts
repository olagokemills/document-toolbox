import puppeteer from 'puppeteer'

export async function htmlToPdf(html: string, format: 'A4' | 'Letter' = 'A4'): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const protocol = new URL(request.url()).protocol
      if (protocol === 'data:' || protocol === 'blob:' || protocol === 'about:') {
        void request.continue()
        return
      }
      void request.abort('blockedbyclient')
    })
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({ format, printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
