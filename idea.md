Ideally: no, the core app should make zero external API calls.

For your promise to be clean, the product should work like this:

Open app → select PDF → process locally → export result

No file upload.
No cloud processing.
No account.
No database.
No external API needed for the 10 MVP features.

For the features we listed, external APIs are not required:

Merge PDFs              → local
Split PDF               → local
Reorder pages           → local
Delete pages            → local
Rotate pages            → local
Extract selected pages  → local
Images to PDF           → local
PDF to images           → local
Add watermark           → local
Remove metadata         → local

The only external calls I would allow, and only with clear user awareness, are non-document calls like:

Check for app updates
Download a newer version
Open documentation/GitHub
Report a bug manually

But even those should not touch user files.

For maximum trust, you can have a privacy statement like:

This app does not upload your files.
PDF processing happens locally on your device.
No account is required.
No document content is sent to any server.
The app may optionally check for software updates, but this never includes your files or document contents.

My critical recommendation:

For version 1, make it fully offline-capable.

That means:

Internet off → app still works

This is a very powerful trust signal.

Later, if you add optional update checks, make it clear:

Core PDF tools work offline.
Update checks can be disabled.
No document data is sent.

Also, avoid analytics in the beginning. Even “harmless” analytics can weaken your privacy positioning.

So the clean answer is:

No external API calls for PDF processing. The app should only run locally. Any external call, like update checking, should be optional, transparent, and never include document data.

Good, now create me a full prd that takes care of this, please. We will feed this to codex tool to run, so i need you to be very detailed and be good

Absolutely — I’ll turn this into a build-ready PRD, not a vague product note. I’ll keep the product local-first, no signup, no database, and make the architecture detailed enough for a coding agent to follow.

Thought for 16s

Below is a full PRD you can feed into Codex. I’ve written it as a build specification, not just product strategy.

The key principle stays intact:

No signup. No database. No cloud processing. No external API calls for PDF operations. Files stay on the user’s device.

PRD: Local-First Private PDF Toolkit
1. Product Name

Working name:

PrivatePDF Local

Alternative names:

LocalPDF
SafePDF
PaperLock
PDFVault Local
Private Paper

For implementation, use the internal project name:

private-pdf-local
2. Product Summary

PrivatePDF Local is a privacy-first local PDF toolkit that allows users to perform common PDF operations on their own device without uploading files to any external server.

The product has two user-facing distributions:

1. Technical users:
   They clone the GitHub repository, install dependencies, and run the app locally.

2. Non-technical users:
   They download a ready-made desktop application and use it locally.

Both distributions must use the same shared PDF engine.

The product must not require:

- signup
- login
- database
- cloud upload
- cloud processing
- external PDF API
- user account
- document history

The core product promise is:

Your files stay on your device. No uploads. No accounts. No cloud processing.

3. Product Philosophy

This product is not a SaaS product.

It is a local-first tool.

The user should feel safe because the product is actually designed safely.

The app should be useful for people handling:

- contracts
- invoices
- bank statements
- CVs
- school documents
- tax documents
- IDs
- legal documents
- HR documents
- business proposals
- confidential company files

The product exists because many users casually upload sensitive PDFs to online tools without understanding the privacy tradeoff.

PrivatePDF Local gives them a safer alternative.

4. Core Promise

The app must clearly communicate:

No upload.
No account.
No cloud.
No database.
No document tracking.
No document history.
No external PDF processing.
Your files stay on your device.

The app must work offline after installation.

For version 1, there should be no analytics, no telemetry, and no automatic external API calls.

Optional update checking can be added in a later version, but it must be:

- disabled by default, or clearly disclosed
- unrelated to document content
- never send filenames, document text, document metadata, or usage history
5. Target Users
5.1 Technical Users

These users are comfortable with GitHub, Node.js, and terminal commands.

They should be able to:

git clone <repo-url>
cd private-pdf-local
npm install
npm run dev

Then open the local web app and use the PDF tools on their own machine.

They value:

- open-source transparency
- ability to inspect the code
- local processing
- no accounts
- no vendor lock-in
- no cloud dependency
5.2 Non-Technical Users

These users are not comfortable with GitHub or terminal commands.

They should be able to:

Download app
Open app
Drag PDF files
Choose an action
Export result

They value:

- simplicity
- privacy
- safety
- speed
- no setup complexity
- no technical language
6. Supported Platforms
6.1 Local Web App

The technical-user version should be built as a local Next.js app.

Reason:

Next.js Route Handlers allow request handlers inside the app directory, so the local web app can have both UI and local server-side handlers in one project instead of requiring a separate backend app.

The local web app should run on:

- macOS
- Windows
- Linux

Supported browsers:

- Chrome
- Edge
- Firefox
- Safari where possible
6.2 Desktop App

The non-technical-user version should be built with Electron.

Electron must be configured securely.

Important Electron security requirements:

- contextIsolation: true
- nodeIntegration: false
- sandbox where practical
- no direct filesystem access from renderer
- expose only safe APIs through preload

Electron’s context isolation keeps preload scripts and Electron internals separate from the loaded web content, which helps prevent the UI layer from directly accessing powerful internals.

Electron security documentation also recommends enabling protections such as context isolation and avoiding dangerous renderer privileges.

7. Product Scope
7.1 Version 1 Features

The first version must include exactly these 10 core features:

1. Merge PDFs
2. Split PDF
3. Reorder pages
4. Delete pages
5. Rotate pages
6. Extract selected pages
7. Images to PDF
8. PDF to images
9. Add watermark
10. Remove metadata

These features are selected because they are useful, practical, privacy-relevant, and can be performed locally without external APIs.

7.2 Explicit Non-Goals for Version 1

Do not build these in version 1:

- signup
- login
- database
- cloud upload
- cloud storage
- AI features
- OCR
- e-signatures
- collaboration
- team accounts
- payment/billing
- document history
- automatic cloud sync
- browser extension
- mobile app
- advanced redaction
- advanced compression

Important:

Redaction is not included in version 1 because bad redaction can visually hide text while leaving the real text inside the PDF. That can create serious privacy leaks.

7.3 Version 2 Conversion Suite

Version 2 adds 11 conversion tools. All must remain fully local. No external conversion APIs. No file upload.

Convert TO PDF:

1. JPG to PDF       — extension of existing Images to PDF (already supported)
2. Word to PDF      — local
3. PowerPoint to PDF — local
4. Excel to PDF     — local
5. HTML to PDF      — local

Convert FROM PDF:

6.  PDF to JPG          — extension of existing PDF to Images (add JPEG format)
7.  PDF to Word         — local (with documented fidelity limitations)
8.  PDF to PowerPoint   — local (image-based slides, documented limitation)
9.  PDF to Excel        — local (text/table extraction, documented limitation)
10. PDF to PDF/A        — local

Important honesty rule for Version 2:

Some of these conversions cannot achieve perfect fidelity when done locally with pure JavaScript. The app must display a clear, calm note for lossy conversions:

  Converted locally on your device.
  Complex formatting may differ from the original.
  Your file was not uploaded anywhere.

Do not claim perfect conversion. Honest limitations build trust. Silently bad output destroys it.

Implementation approach for each conversion (all local, no external services):

Word to PDF:
  - Parse .docx with mammoth (converts DOCX to clean HTML, no cloud)
  - Render HTML and print to PDF
  - Web app: puppeteer (headless Chromium, local)
  - Desktop app: Electron webContents.printToPDF() (Chromium built in)
  - Limitations: complex layout, tracked changes, comments, macros not preserved

PowerPoint to PDF:
  - Parse .pptx (ZIP archive, extract slide XML) with a local PPTX reader
  - Render each slide to Canvas and export pages as PDF
  - Or: LibreOffice headless as optional system dependency
  - Limitations: animations, embedded fonts, complex shapes may differ
  - Fallback quality: slide images embedded in PDF is acceptable for v2

Excel to PDF:
  - Parse .xlsx with SheetJS (xlsx, fully local)
  - Render each sheet as an HTML table
  - Print HTML table to PDF via puppeteer or Electron print API
  - Limitations: charts, formulas are shown as values, complex formatting may differ

HTML to PDF:
  - Accept a local .html file from the user
  - Web app: puppeteer with local Chrome renders it to PDF
  - Desktop app: Electron webContents.printToPDF() with custom page settings
  - Limitations: external fonts/images referenced in the HTML may not load if offline
  - Security: the HTML file is loaded in an isolated context, no network requests for resources

PDF to JPG:
  - Same engine as PDF to Images (pdfjs-dist + browser Canvas)
  - Add JPEG output option alongside existing PNG
  - Use canvas.toBlob('image/jpeg', quality) with configurable quality (default 90%)

PDF to Word:
  - Extract text content and basic structure from PDF using pdf-lib
  - Generate a .docx file using the docx library (fully local, no cloud)
  - Limitations: layout, images, tables, and fonts from the PDF are not preserved
  - Output is editable plain text in Word format, not a layout-accurate replica
  - The app must communicate this clearly in the UI

PDF to PowerPoint:
  - Convert each PDF page to a PNG image using pdfjs-dist
  - Embed each image as a full-slide image in a PPTX using pptxgenjs (local)
  - Output is an image-based PPTX — slides are not editable text
  - This is acceptable and honest; it preserves visual appearance
  - The app must communicate this clearly in the UI

PDF to Excel:
  - Extract text content from PDF using pdf-lib
  - Attempt basic table detection from whitespace/column alignment
  - Output a .xlsx file using SheetJS with extracted data
  - Limitations: only works well for simple single-table PDFs; complex layouts will not parse correctly
  - The app must communicate this clearly: "Works best with simple table-based PDFs."

PDF to PDF/A:
  - PDF/A is an ISO standard subset of PDF designed for long-term archiving
  - Apply best-effort PDF/A-1b compliance using pdf-lib:
    - Embed all fonts
    - Add required XMP metadata (dc:format, pdf:Producer, xmp:CreateDate, pdfaid:part, pdfaid:conformance)
    - Remove JavaScript, encryption, and audio/video attachments
    - Flatten transparency where possible
  - Note: full certified PDF/A validation requires a validator like veraPDF (optional, not bundled in v1)
  - The app should note: "Converted to PDF/A format. For archival certification, validate with veraPDF."

8. Architecture Overview

Use a monorepo.

Recommended structure:

private-pdf-local/
  apps/
    local-web/
      # Next.js app for technical users

    desktop/
      # Electron app for non-technical users

  packages/
    pdf-core/
      # Shared PDF processing engine

    shared-types/
      # Shared TypeScript types and validation schemas

    ui/
      # Optional shared UI components

  docs/
    PRIVACY.md
    SECURITY.md
    LOCAL_PROCESSING.md
    CONTRIBUTING.md

  README.md
  package.json
  tsconfig.base.json

The most important architectural rule:

PDF logic must live in packages/pdf-core.
The Next.js app and Electron app must only call pdf-core.
Do not duplicate PDF logic in each app.

Correct:

apps/local-web/api/merge/route.ts
  calls packages/pdf-core/mergePdf()

apps/desktop/main/pdf-handlers.ts
  calls packages/pdf-core/mergePdf()

Wrong:

apps/local-web has its own merge logic
apps/desktop has a different merge logic
9. Runtime Privacy Requirements

The app must not make external API calls for PDF processing.

During normal usage, the app must not send any of the following outside the user’s device:

- PDF files
- images
- output files
- filenames
- document text
- document metadata
- page count
- file size
- user actions
- error reports containing document details

For version 1:

- no analytics
- no telemetry
- no remote logging
- no crash reporting
- no update checking
- no external CDN dependencies at runtime

All fonts, scripts, CSS, icons, and assets used by the app should be bundled locally.

10. Runtime Network Policy
10.1 Local Web App

The local web app may use:

http://localhost:<port>

It must not call external domains at runtime.

No runtime requests to:

- analytics providers
- logging platforms
- external PDF APIs
- cloud storage
- CDN-hosted scripts
- AI APIs
- tracking pixels

Add a developer-facing test that fails if obvious external API calls are introduced.

Search for:

fetch("https://
fetch('https://
axios.get("https://
axios.post("https://
XMLHttpRequest
navigator.sendBeacon

This is not perfect security, but it catches common accidental violations.

10.2 Desktop App

The Electron desktop app should block unexpected external navigation.

Rules:

- The app should not load remote websites.
- The app should not allow arbitrary external navigation.
- The app should not open external links inside the app window.
- External documentation links may open in the user’s default browser only after user action.

In Electron:

- block window.open by default
- block navigation away from the app
- block loading remote URLs in the main BrowserWindow
11. Data Storage Requirements

The app should not store user documents permanently.

Allowed:

- Temporary files during processing
- In-memory processing
- User-selected output location

Not allowed:

- hidden document archive
- automatic document history
- storing original files in app data
- storing output files without user choosing/exporting
- storing filenames for analytics
- storing document text

If temporary files are used:

- use OS temp directory
- create unique per-operation folders
- delete temp files after operation
- delete temp files on app close where possible
- handle cleanup failure gracefully
12. Security and Safety Requirements

Even though the app is local, it must still treat files as untrusted.

A PDF can be malformed, huge, encrypted, corrupted, or intentionally crafted to break tools.

The app must validate:

- file type
- file extension
- file size
- number of files
- page selection input
- image type
- output filename
- output path

The app must handle failures safely:

- no app crash
- no raw stack traces shown to users
- no confusing technical errors for normal users
- no infinite loading state
- no hanging requests

Safe user error example:

We could not process this PDF. The file may be corrupted, encrypted, or unsupported.
Your file was not uploaded anywhere.

Developer console/logs may include more detail during development, but production builds must not expose sensitive file data.

13. File Validation Rules
13.1 PDF Inputs

Accept only:

application/pdf
.pdf

Do not trust MIME type alone.

Validation should check:

- filename extension is .pdf
- file begins with PDF header where possible
- file size is within limit
- file can be parsed by pdf-core

Suggested version 1 file size limits:

Single PDF max size: 100 MB
Total operation input size: 250 MB
Max PDFs in one merge: 50
Max pages per operation: 1000

If limits are exceeded, return:

This file is too large for the current version. Try a smaller PDF or split the document first.
13.2 Image Inputs

For Images to PDF, accept:

.jpg
.jpeg
.png

Do not include SVG in version 1 because SVG can contain scripts or external references.

Suggested limits:

Single image max size: 20 MB
Total image input size: 200 MB
Max images per operation: 100
14. Feature Requirements
Feature 1: Merge PDFs
Description

Allow users to combine multiple PDF files into one PDF.

User Flow
User selects Merge PDFs
User drops/selects multiple PDFs
User reorders files
User clicks Merge
App generates one combined PDF
User saves/downloads result
Requirements
- Minimum input: 2 PDFs
- Maximum input: 50 PDFs
- Preserve page order from each file
- Allow drag-and-drop reordering before merging
- Show total file count
- Show estimated total size
- Show progress state
- Do not upload files
Validation
- reject non-PDF files
- reject encrypted PDFs if unsupported
- reject files above max size
- reject empty/corrupted PDFs
Safe Error
One or more PDFs could not be merged. Please check that all files are valid PDF documents.
Acceptance Criteria
Given 2 valid PDFs
When user clicks Merge
Then the app produces 1 PDF containing pages from both files in selected order.

Given a .docx file is added
When validation runs
Then the app rejects it with a clear error.

Given one corrupted PDF is added
When user clicks Merge
Then the app does not crash and shows a safe error.
Feature 2: Split PDF
Description

Allow users to split one PDF into multiple PDFs.

Split Modes

Version 1 should support:

1. Split by page range
2. Split every page into separate PDF
User Flow
User selects Split PDF
User uploads one PDF
User chooses split mode
User enters page ranges or selects every-page split
User clicks Split
App generates output files
User downloads result as separate files or ZIP
Page Range Input Examples
1-3
4-7
8
10-12

Multiple ranges can be separated by commas:

1-3, 5, 8-10
Validation
- page numbers must be positive integers
- page numbers must not exceed total pages
- range start must be less than or equal to range end
- duplicate ranges are allowed but should be clearly handled
Safe Error
Please enter valid page ranges. Example: 1-3, 5, 8-10.
Acceptance Criteria
Given a 10-page PDF
When user enters 1-3
Then app creates a PDF with pages 1, 2, and 3.

Given user enters 12-15 for a 10-page PDF
Then app rejects the input.

Given user chooses split every page
Then app creates 10 single-page PDFs.
Feature 3: Reorder Pages
Description

Allow users to visually reorder pages in a PDF.

User Flow
User selects Reorder Pages
User uploads one PDF
App shows page thumbnails or page boxes
User drags pages into new order
User clicks Save
App generates reordered PDF
Requirements
- Show page numbers
- Allow drag-and-drop reordering
- Allow reset to original order
- Preserve all selected pages
- Do not alter content except page order
Acceptance Criteria
Given a 3-page PDF
When user reorders pages to 3,1,2
Then output PDF should follow page order 3,1,2.
Feature 4: Delete Pages
Description

Allow users to remove selected pages from a PDF.

User Flow
User selects Delete Pages
User uploads one PDF
App shows page thumbnails or page list
User selects pages to delete
User clicks Delete Pages
App generates new PDF without selected pages
Requirements
- User cannot delete all pages
- Show selected page count
- Confirm destructive action in UI copy
Safe Error
A PDF must contain at least one page. Please leave at least one page selected.
Acceptance Criteria
Given a 5-page PDF
When user deletes pages 2 and 4
Then output PDF contains pages 1, 3, and 5.
Feature 5: Rotate Pages
Description

Allow users to rotate pages in a PDF.

Rotation Options
90 degrees clockwise
180 degrees
270 degrees clockwise
User Flow
User selects Rotate Pages
User uploads one PDF
User selects all pages or specific pages
User chooses rotation angle
User clicks Rotate
App generates rotated PDF
Requirements
- Support rotating all pages
- Support rotating selected pages
- Show rotation preview where possible
Acceptance Criteria
Given a PDF
When user rotates page 1 by 90 degrees
Then only page 1 is rotated in the output.
Feature 6: Extract Selected Pages
Description

Allow users to extract specific pages from one PDF into a new PDF.

User Flow
User selects Extract Pages
User uploads one PDF
User enters page ranges or selects pages visually
User clicks Extract
App generates a new PDF with only selected pages
Validation

Same as Split PDF page range validation.

Acceptance Criteria
Given a 10-page PDF
When user extracts 2-4, 8
Then output PDF contains pages 2, 3, 4, and 8.
Feature 7: Images to PDF
Description

Allow users to convert images into a PDF.

Supported Inputs
.jpg
.jpeg
.png
User Flow
User selects Images to PDF
User adds images
User reorders images
User chooses page size option
User clicks Convert
App generates PDF
Page Size Options

Version 1:

- Fit image to page
- A4 portrait
- A4 landscape
Requirements
- preserve image order
- allow image reorder
- reject unsupported image types
- reject oversized images
Acceptance Criteria
Given 3 PNG/JPG images
When user converts them
Then output PDF has 3 pages in the selected order.
Feature 8: PDF to Images
Description

Allow users to convert PDF pages into images.

Output Format

Version 1 should support:

PNG

JPG can be added later.

User Flow
User selects PDF to Images
User uploads one PDF
User selects all pages or page ranges
User clicks Convert
App generates PNG images
User downloads images or ZIP
Requirements
- support all pages
- support selected page ranges
- output one image per page
- package multiple images as ZIP
Acceptance Criteria
Given a 5-page PDF
When user converts all pages
Then app generates 5 PNG files.
Feature 9: Add Watermark
Description

Allow users to add a text watermark to PDF pages.

Version 1 Watermark Type

Only text watermark.

Do not support image watermark in version 1.

User Flow
User selects Add Watermark
User uploads one PDF
User enters watermark text
User chooses position
User chooses opacity
User chooses pages
User clicks Apply
App generates watermarked PDF
Watermark Options
Text
Position:
  - center
  - top-left
  - top-right
  - bottom-left
  - bottom-right

Opacity:
  - 10%
  - 25%
  - 50%

Rotation:
  - 0 degrees
  - 45 degrees
Validation
- watermark text max length: 100 characters
- reject empty watermark
- page range must be valid
Acceptance Criteria
Given a PDF and watermark text "CONFIDENTIAL"
When user applies center watermark to all pages
Then every page contains the watermark.
Feature 10: Remove Metadata
Description

Allow users to remove common metadata from a PDF.

Metadata to Remove Where Possible
- title
- author
- subject
- keywords
- creator
- producer
- creation date
- modification date

Important:

Metadata removal can vary depending on the PDF library and PDF structure. The app should not overpromise perfect forensic cleaning.

UI Copy

Use careful wording:

Remove common PDF metadata.
This helps reduce visible document information, but it may not remove every hidden trace from every PDF.
User Flow
User selects Remove Metadata
User uploads one PDF
App shows detected metadata where safe
User clicks Remove Metadata
App generates cleaned PDF
Acceptance Criteria
Given a PDF with title and author metadata
When user removes metadata
Then output PDF should not contain those common metadata fields.
Feature 11: Word to PDF
Description

Convert a .docx Word document to a PDF locally.

Supported Inputs
.docx

Do not support .doc (legacy binary format) in version 2.

User Flow
User selects Word to PDF
User uploads a .docx file
User clicks Convert
App generates a PDF
User downloads result

Requirements
- process locally using mammoth + puppeteer (web) or Electron print API (desktop)
- show clear fidelity warning: "Complex formatting may differ from the original"
- reject non-.docx files
- reject oversized files

Safe Error
We could not convert this Word document. The file may be corrupted or in an unsupported format.
Your file was not uploaded anywhere.

Acceptance Criteria
Given a .docx file with text and headings
When user clicks Convert
Then app generates a PDF with the document content.

Given a .exe file
When user selects it
Then app rejects it with a clear error.

Feature 12: PowerPoint to PDF
Description

Convert a .pptx PowerPoint file to a PDF locally.

Supported Inputs
.pptx

Do not support .ppt (legacy binary format) in version 2.

User Flow
User selects PowerPoint to PDF
User uploads a .pptx file
User clicks Convert
App generates a PDF (one page per slide)
User downloads result

Requirements
- one PDF page per slide
- render slides as images where full layout parsing is not possible
- show fidelity warning: "Animations and complex formatting are not preserved"
- reject non-.pptx files

Acceptance Criteria
Given a 10-slide .pptx
When user converts
Then app generates a 10-page PDF.

Feature 13: Excel to PDF
Description

Convert a .xlsx Excel file to a PDF locally.

Supported Inputs
.xlsx

User Flow
User selects Excel to PDF
User uploads a .xlsx file
User clicks Convert
App generates a PDF of the spreadsheet content
User downloads result

Requirements
- parse with SheetJS (local, no cloud)
- render sheets as HTML tables, print to PDF
- show note: "Charts and complex formatting may not appear as in Excel"
- reject non-.xlsx files

Acceptance Criteria
Given a .xlsx with one sheet of tabular data
When user converts
Then app generates a readable PDF of the table.

Feature 14: HTML to PDF
Description

Convert a local .html file to a PDF.

Supported Inputs
.html

User Flow
User selects HTML to PDF
User selects a local .html file
User clicks Convert
App renders the HTML and generates a PDF
User downloads result

Requirements
- render using puppeteer (web app) or Electron print API (desktop)
- load only local resources; do not make external network calls for fonts or images
- show note: "External fonts or images referenced in the HTML may not appear if they are not bundled locally"
- reject non-.html files

Acceptance Criteria
Given a self-contained .html file
When user converts
Then app generates a PDF matching the HTML layout.

Feature 15: PDF to JPG
Description

Export PDF pages as JPEG images.

This extends Feature 8 (PDF to Images) with JPEG format support.

User Flow
User selects PDF to JPG
User uploads one PDF
User selects all pages or specific pages
User chooses JPEG quality (standard / high)
User clicks Convert
App generates JPEG images
User downloads images or ZIP

Quality Options
Standard: 75%
High: 90%

Acceptance Criteria
Given a 3-page PDF
When user converts with high quality
Then app generates 3 .jpg files.

Feature 16: PDF to Word
Description

Convert a PDF to an editable Word .docx document locally.

Output type: text-based .docx, not a layout-accurate replica.

The app must clearly communicate this limitation before the user converts.

UI Copy
Convert PDF to an editable Word document.
Note: Layout, images, and complex formatting from the PDF will not be preserved.
The output is a plain editable text document. This is a local conversion — your file is not uploaded.

User Flow
User selects PDF to Word
User uploads one PDF
User reads the limitation note
User clicks Convert
App extracts text content and generates a .docx
User downloads result

Requirements
- extract text using pdf-lib or pdfjs-dist
- generate .docx using the docx library (local, no cloud)
- clearly label limitation in UI before conversion
- do not attempt layout reconstruction beyond basic paragraphs and headings
- reject non-PDF files

Safe Error
We could not extract text from this PDF. It may be image-based, encrypted, or unsupported.
Your file was not uploaded anywhere.

Acceptance Criteria
Given a text-based PDF with paragraphs
When user converts
Then app generates a .docx with the extracted text.

Given an image-only scanned PDF
When user converts
Then app returns a safe error explaining OCR is not supported.

Feature 17: PDF to PowerPoint
Description

Convert a PDF to a .pptx file where each PDF page becomes a slide image.

Output type: image-based PPTX. Slides are not editable text.

UI Copy
Convert PDF pages to PowerPoint slides.
Note: Each page is converted as an image. Slide text will not be editable.
This is a local conversion — your file is not uploaded.

User Flow
User selects PDF to PowerPoint
User uploads one PDF
User clicks Convert
App converts each page to an image and embeds it in a PPTX slide
User downloads result

Requirements
- render PDF pages to images using pdfjs-dist (same as PDF to Images)
- embed images as full-slide content using pptxgenjs (local)
- clearly label image-based limitation in UI
- reject non-PDF files

Acceptance Criteria
Given a 5-page PDF
When user converts
Then app generates a .pptx with 5 slides, each containing the corresponding page as an image.

Feature 18: PDF to Excel
Description

Extract tabular data from a PDF and export to a .xlsx file locally.

Output type: best-effort table extraction. Works well for simple single-table PDFs.

UI Copy
Extract table data from a PDF into Excel.
Note: Works best with simple, clearly structured tables. Complex layouts, multi-column text, or image-based PDFs will not extract reliably.
This is a local conversion — your file is not uploaded.

User Flow
User selects PDF to Excel
User uploads one PDF
User clicks Extract
App attempts table extraction and generates a .xlsx
User downloads result

Requirements
- extract text content from PDF using pdf-lib or pdfjs-dist
- detect column/row structure from whitespace alignment
- output to .xlsx using SheetJS (local, no cloud)
- clearly label extraction limitations in UI
- reject non-PDF files
- for image-based PDFs, return a safe error (OCR not supported in version 2)

Safe Error
We could not extract table data from this PDF.
It may be image-based, complex, or unsupported.
Your file was not uploaded anywhere.

Acceptance Criteria
Given a simple single-table text-based PDF
When user extracts
Then app generates a .xlsx with the table rows and columns.

Feature 19: PDF to PDF/A
Description

Convert a standard PDF to PDF/A format for long-term archiving.

PDF/A is an ISO standard (ISO 19005) that restricts certain PDF features to ensure documents can be reliably reproduced in the future without depending on external software or fonts.

Version 2 targets: PDF/A-1b (basic visual conformance).

UI Copy
Convert to PDF/A for long-term archiving.
PDF/A embeds fonts and removes features that may not be supported in future software.
For certified archival use, validate the output with a PDF/A validator like veraPDF.
This is a local conversion — your file is not uploaded.

User Flow
User selects PDF to PDF/A
User uploads one PDF
User clicks Convert
App applies PDF/A compliance transformations
User downloads result

Requirements
- embed all referenced fonts using pdf-lib
- add required XMP metadata block (pdfaid:part=1, pdfaid:conformance=B)
- strip JavaScript actions, sound, video, and encryption
- add dc:format, pdf:Producer, xmp:CreateDate metadata
- reject non-PDF files

Important limitation note:
pdf-lib does not natively produce fully certified PDF/A. The output applies best-effort transformations. For formal archival certification, the user should validate with an external tool like veraPDF (free, open source).

The app must show this note clearly.

Acceptance Criteria
Given a standard PDF
When user converts to PDF/A
Then app produces a PDF with pdfaid:part and pdfaid:conformance XMP metadata embedded.

Given a PDF with JavaScript
When user converts
Then the output has no JavaScript actions.

15. Shared PDF Core Package

Package:

packages/pdf-core
Required Public API

Create clear functions:

mergePdfs(inputFiles: PdfInputFile[]): Promise<PdfOperationResult>

splitPdf(inputFile: PdfInputFile, options: SplitPdfOptions): Promise<PdfOperationResult>

reorderPdfPages(inputFile: PdfInputFile, options: ReorderPagesOptions): Promise<PdfOperationResult>

deletePdfPages(inputFile: PdfInputFile, options: DeletePagesOptions): Promise<PdfOperationResult>

rotatePdfPages(inputFile: PdfInputFile, options: RotatePagesOptions): Promise<PdfOperationResult>

extractPdfPages(inputFile: PdfInputFile, options: ExtractPagesOptions): Promise<PdfOperationResult>

imagesToPdf(inputFiles: ImageInputFile[], options: ImagesToPdfOptions): Promise<PdfOperationResult>

pdfToImages(inputFile: PdfInputFile, options: PdfToImagesOptions): Promise<ImageOperationResult>

addTextWatermark(inputFile: PdfInputFile, options: WatermarkOptions): Promise<PdfOperationResult>

removePdfMetadata(inputFile: PdfInputFile): Promise<PdfOperationResult>
Shared Result Shape
export type OperationStatus = 'success' | 'error';

export interface PdfOperationResult {
  status: OperationStatus;
  fileName?: string;
  mimeType?: 'application/pdf';
  data?: Uint8Array;
  error?: SafeOperationError;
}

export interface ImageOperationResult {
  status: OperationStatus;
  files?: Array<{
    fileName: string;
    mimeType: 'image/png';
    data: Uint8Array;
  }>;
  error?: SafeOperationError;
}

export interface SafeOperationError {
  code: string;
  userMessage: string;
  developerMessage?: string;
}
Error Codes

Use consistent error codes:

INVALID_FILE_TYPE
FILE_TOO_LARGE
TOO_MANY_FILES
PDF_PARSE_FAILED
PDF_ENCRYPTED_UNSUPPORTED
INVALID_PAGE_RANGE
NO_PAGES_SELECTED
ALL_PAGES_DELETED
IMAGE_PARSE_FAILED
OPERATION_FAILED
16. Shared Types Package

Package:

packages/shared-types

Purpose:

- shared validation schemas
- shared operation types
- shared constants
- shared file limits

Example constants:

export const FILE_LIMITS = {
  maxSinglePdfSizeBytes: 100 * 1024 * 1024,
  maxTotalInputSizeBytes: 250 * 1024 * 1024,
  maxMergeFileCount: 50,
  maxPdfPageCount: 1000,
  maxSingleImageSizeBytes: 20 * 1024 * 1024,
  maxImageCount: 100,
};
17. Local Web App Requirements

App:

apps/local-web

Framework:

Next.js
TypeScript

The local web app must:

- run locally
- require no database
- require no environment variables for core use
- not call external APIs
- use packages/pdf-core for all PDF work
- provide clear privacy messaging
Pages
/
  Home page with feature grid

/tools/merge
/tools/split
/tools/reorder
/tools/delete-pages
/tools/rotate
/tools/extract
/tools/images-to-pdf
/tools/pdf-to-images
/tools/watermark
/tools/remove-metadata

/privacy
/about-local-processing
API Route Handlers

Use local route handlers for operations that need server-side processing.

Example:

app/api/pdf/merge/route.ts
app/api/pdf/split/route.ts
app/api/pdf/rotate/route.ts

These route handlers must only call local code.

They must not call external services.

18. Desktop App Requirements

App:

apps/desktop

Framework:

Electron
TypeScript

The desktop app must:

- package for Windows, macOS, and Linux eventually
- work offline
- process files locally
- not require signup
- not require network
- use packages/pdf-core
Electron Security Config

BrowserWindow must use safe defaults:

webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  preload: path.join(__dirname, 'preload.js')
}

Renderer must not directly access:

fs
path
child_process
os
process

Expose a narrow API through preload:

window.privatePdf = {
  mergePdfs,
  splitPdf,
  rotatePages,
  deletePages,
  extractPages,
  reorderPages,
  imagesToPdf,
  pdfToImages,
  addWatermark,
  removeMetadata,
};

Do not expose generic methods like:

window.privatePdf.readFile(anyPath)
window.privatePdf.writeFile(anyPath)
window.privatePdf.executeCommand(command)

Those are too powerful.

19. UX Requirements

The app should feel safe, calm, and simple.

Home Page Copy
Private PDF tools that run on your device.

No uploads.
No accounts.
No cloud processing.

Choose a tool and process your files locally.
Persistent Trust Badge

Show a small trust message across the app:

Files are processed locally on your device.
Empty State
Drop your PDF here or choose a file from your device.
Your file will not be uploaded.
Processing State
Processing locally...
Please keep this window open.
Success State
Done. Your file was processed locally.
Error State
We could not process this file.
It may be corrupted, encrypted, too large, or unsupported.
Your file was not uploaded anywhere.
20. UI Design Requirements

Keep the interface clean and practical.

Use:

- simple feature cards
- drag-and-drop zones
- clear selected file list
- reorder controls where needed
- progress indicators
- safe error messages
- download/export button

Avoid:

- dashboards
- accounts
- user profile menus
- billing pages
- unnecessary onboarding
- heavy animations
- confusing security claims
21. Accessibility Requirements

The app should support:

- keyboard navigation
- visible focus states
- accessible button labels
- readable contrast
- error messages connected to form fields
- drag-and-drop with fallback file picker

Every drag-and-drop input must also have a normal file picker.

22. Privacy Documents

Create:

docs/PRIVACY.md
docs/LOCAL_PROCESSING.md
PRIVACY.md Must Say
PrivatePDF Local does not require an account.

PrivatePDF Local does not upload your documents.

PDF processing happens locally on your device.

The app does not store your document history.

The app does not send your document content, filenames, metadata, or output files to external servers.

Version 1 does not include analytics, telemetry, crash reporting, or cloud sync.
LOCAL_PROCESSING.md Must Explain
- how local processing works
- what happens when files are selected
- whether temporary files are used
- how output files are created
- how temporary files are cleaned up
- what features work offline
23. README Requirements

README should include:

- product description
- privacy promise
- supported features
- how to run locally
- how to build desktop app
- architecture overview
- no-cloud guarantee for version 1
- contribution guide
README Opening Copy
# PrivatePDF Local

PrivatePDF Local is a local-first PDF toolkit.

It lets you merge, split, rotate, reorder, extract, watermark, convert, and clean PDFs on your own device.

No uploads.
No accounts.
No cloud processing.
No database.

Your files stay on your device.
24. Developer Setup

Use Node.js LTS.

Recommended package manager:

pnpm

Root commands:

pnpm install
pnpm dev:web
pnpm dev:desktop
pnpm build:web
pnpm build:desktop
pnpm test
pnpm lint
pnpm typecheck
25. Suggested Tech Stack
Core
TypeScript
pnpm workspace
Local Web
Next.js
React
TypeScript
Desktop
Electron
TypeScript
PDF Processing (Version 1)

Use local libraries only.

pdf-lib          — PDF creation, manipulation, metadata
pdfjs-dist       — PDF rendering to Canvas (PDF to images, PDF to JPG)
jszip            — multi-file ZIP output

Conversion Libraries (Version 2 additions)

All local, no external APIs.

mammoth          — DOCX to clean HTML (Word to PDF)
docx             — generate .docx files (PDF to Word)
xlsx (SheetJS)   — parse .xlsx and generate .xlsx (Excel to/from PDF)
pptxgenjs        — generate .pptx files (PDF to PowerPoint, PowerPoint to PDF)
puppeteer        — headless Chromium for HTML/Word/Excel to PDF (web app only)
                   Desktop app uses Electron webContents.printToPDF() instead

Note on puppeteer:
puppeteer downloads a local Chromium binary. It must not make network calls during conversion.
Only use it for rendering HTML → PDF. Do not use any puppeteer cloud/remote features.

Do not use external PDF APIs.
Do not use cloud conversion services.
Do not use LibreOffice as a hard dependency (optional system tool, not bundled).

26. Reliability Requirements

Each operation must:

- validate inputs before processing
- fail safely
- avoid hanging forever
- clean up temporary files
- return safe user-facing errors
- not crash the app

For operations that may take time:

- show loading state
- prevent duplicate submissions
- provide cancellation later if practical

Version 1 can skip cancellation if implementation cost is high, but the UI must not allow repeated rapid submissions.

27. Error Handling Requirements

Do not show raw errors like:

TypeError: Cannot read properties of undefined
PDFDocument.load failed at object stream
ENOENT: no such file or directory

Instead show:

We could not process this PDF. The file may be corrupted, encrypted, or unsupported.

Internally, preserve developer error codes for debugging.

28. Testing Requirements
28.1 Unit Tests

Add unit tests for packages/pdf-core.

Test:

- merge valid PDFs
- reject invalid PDF
- split by range
- reject invalid page ranges
- reorder pages
- delete selected pages
- prevent deleting all pages
- rotate selected pages
- extract selected pages
- convert images to PDF
- add watermark
- remove metadata
28.2 Security/Privacy Tests

Add tests or static checks for:

- no external API calls in core package
- no analytics packages
- no telemetry package
- no hardcoded API keys
- no remote PDF processing endpoints
- no document content logging
28.3 UI Tests

Test:

- file picker works
- drag and drop works
- invalid files are rejected
- oversized files are rejected
- safe error messages are shown
- success state appears after operation
28.4 Desktop Tests

Test:

- Electron starts
- nodeIntegration is false
- contextIsolation is true
- renderer cannot access fs directly
- only safe preload APIs are exposed
29. Launch Criteria

Version 1 is ready when:

- all 10 features work locally
- app works offline
- no signup exists
- no database exists
- no external PDF API exists
- no analytics exists
- no telemetry exists
- technical users can run the local web app from GitHub
- non-technical users can install and run the desktop app
- privacy documentation exists
- safe errors are shown
- core tests pass
- file validation exists
30. Top 5 Build Priorities

Build in this order:

1. Monorepo setup and shared pdf-core package
2. Merge, split, rotate, delete, extract PDF operations
3. Local web UI with drag-and-drop and export
4. Electron shell using same pdf-core package
5. Remaining features: reorder, images to PDF, PDF to images, watermark, remove metadata
31. First Build Milestone
Milestone 1: Core Local Proof

Deliver:

- monorepo
- packages/pdf-core
- apps/local-web
- merge PDFs
- split PDF
- rotate pages
- local privacy UI copy
- no external API call

Success:

A technical user can clone the repo, run one command, open the local app, merge PDFs, split PDFs, rotate pages, and export files without internet.
32. Second Build Milestone
Milestone 2: Complete 10 Features in Local Web

Deliver all 10 tools in the Next.js local web app.

Success:

All 10 features work locally through the browser interface.
33. Third Build Milestone
Milestone 3: Desktop App

Deliver:

- Electron app
- same 10 features
- secure preload bridge
- no direct renderer filesystem access
- offline usage

Success:

A non-technical user can download the desktop build, open it, use all 10 PDF tools locally, and export results.

34. Fourth Build Milestone
Milestone 4: Conversion Suite

Deliver all 11 conversion tools in both the local web app and the desktop app.

Convert to PDF (5 tools):
- JPG to PDF      — already built; confirm JPEG and PNG both work
- Word to PDF     — mammoth + puppeteer (web) / Electron print API (desktop)
- PowerPoint to PDF — PPTX parse + render to PDF via Canvas
- Excel to PDF    — SheetJS → HTML → puppeteer/Electron print
- HTML to PDF     — local file → puppeteer/Electron print

Convert from PDF (6 tools):
- PDF to JPG      — extend existing PDF to Images with JPEG format
- PDF to Word     — pdf-lib text extract + docx library
- PDF to PowerPoint — pdfjs-dist page images + pptxgenjs slides
- PDF to Excel    — text/table extraction + SheetJS output
- PDF to PDF/A    — pdf-lib metadata + XMP conformance block

Rules for Milestone 4:
- every tool still processes locally — no external API calls
- every lossy conversion (PDF to Word, PDF to Excel, PDF to PowerPoint) must
  display the fidelity warning in the UI before the user converts
- JPG quality options (standard/high) must be exposed in the UI for PDF to JPG
- no new privacy-violating dependencies may be added

Success:

All 11 conversion tools work locally in the browser and in the desktop app.
Lossy conversions are clearly labelled.
No files are uploaded anywhere.
34. Codex Implementation Instruction

Use this instruction when feeding to Codex:

Build a local-first privacy-focused PDF toolkit using a monorepo.

The app must have:
- apps/local-web: Next.js app for technical users
- apps/desktop: Electron app for non-technical users
- packages/pdf-core: shared PDF processing logic
- packages/shared-types: shared constants, validation schemas, and types

Important:
- No signup
- No login
- No database
- No cloud processing
- No external PDF APIs
- No analytics
- No telemetry
- No document history
- No external API calls for core PDF operations

Implement these 10 core features (Version 1):
1. Merge PDFs
2. Split PDF
3. Reorder pages
4. Delete pages
5. Rotate pages
6. Extract selected pages
7. Images to PDF
8. PDF to images
9. Add text watermark
10. Remove common PDF metadata

Implement these 11 conversion features (Version 2):
11. Word to PDF
12. PowerPoint to PDF
13. Excel to PDF
14. HTML to PDF
15. PDF to JPG
16. PDF to Word
17. PDF to PowerPoint
18. PDF to Excel
19. PDF to PDF/A

Note for Version 2 conversions:
- all processing must remain local
- use mammoth, docx, xlsx (SheetJS), pptxgenjs, and puppeteer (web) or Electron print API (desktop)
- lossy conversions (PDF to Word, PDF to Excel, PDF to PowerPoint) must display a fidelity warning in the UI
- JPG/PNG quality must be user-selectable for PDF to JPG

All file processing must happen locally.
All shared PDF logic must live in packages/pdf-core.
The Next.js and Electron apps must call pdf-core instead of duplicating logic.

Use beginner-friendly, privacy-focused UI copy:
“No uploads. No accounts. No cloud processing. Your files stay on your device.”

Create safe validation and safe error messages.
Do not expose stack traces to users.
Do not log document content, filenames, metadata, or output files.

For Electron:
- nodeIntegration must be false
- contextIsolation must be true
- renderer must not directly access fs/path/child_process
- expose only narrow safe PDF APIs through preload

Add tests for core PDF operations, validation, and privacy rules.
35. Critical Product Warning

Do not let the app slowly become SaaS by accident.

Avoid adding:

- accounts
- document sync
- cloud processing
- document history
- AI document analysis
- analytics
- remote logs

Those may sound useful, but they weaken the core trust promise.

The strongest version of this product is simple:

Open it. Use it. Process locally. Export. Done.

36. Final Product Statement

PrivatePDF Local is a local-first PDF toolkit for people who want to work with sensitive documents without uploading them to online PDF websites.

It serves two groups:

Technical users:
Clone the repo and run locally.

Non-technical users:
Download the desktop app and use locally.

Both versions share one PDF engine.

The product is built around one promise:

No uploads. No accounts. No cloud processing. Your files stay on your device.