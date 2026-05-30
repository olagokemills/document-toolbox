# PrivatePDF Local — Agent Rules

PrivatePDF Local is a privacy-first, local-only PDF toolkit. It has two distributions (Next.js local web app, Electron desktop app) that share one PDF engine (`packages/pdf-core`). Zero cloud dependency. Zero signup. Zero telemetry.

Read the full PRD in `idea.md` before making any structural decisions.

---

## Core Invariants

These rules are absolute. No exceptions, no workarounds, no "just for now."

- **No external API calls for PDF processing.** All PDF work happens locally using bundled libraries.
- **No analytics, telemetry, crash reporting, or remote logging** of any kind in v1.
- **No database.** No user accounts. No document history. No cloud storage.
- **All PDF logic lives in `packages/pdf-core` only.** Never duplicate PDF logic in app code.
- **The app must work with the internet turned off.** If a feature requires network, it does not belong in v1.

Violating any of these breaks the product's core promise. If a requirement seems to need one of the above, stop and flag it rather than working around it.

---

## Monorepo Structure

```
private-pdf-local/
  apps/
    local-web/          # Next.js app — technical users
    desktop/            # Electron app — non-technical users
  packages/
    pdf-core/           # All PDF processing logic
    shared-types/       # Shared TypeScript types, constants, validation schemas
    ui/                 # Optional shared React components
  docs/
    PRIVACY.md
    LOCAL_PROCESSING.md
    SECURITY.md
    CONTRIBUTING.md
  AGENTS.md
  README.md
  package.json          # pnpm workspace root
  tsconfig.base.json
```

**Import direction:** `apps/*` → `packages/*`. Never `packages/*` → `apps/*`.

**pdf-core is the only PDF home.** If you are writing code that loads, parses, transforms, or renders a PDF and you are not in `packages/pdf-core`, you are in the wrong place.

**shared-types owns limits and types.** Never hardcode file size limits, page limits, or shared type definitions in app code.

---

## TypeScript Rules

- `"strict": true` in every tsconfig. No exceptions.
- No `any`. Use `unknown` with type narrowing, or define an explicit type.
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- Prefer `interface` for object shapes; `type` for unions, aliases, and mapped types.
- Export all shared types from `packages/shared-types`. Do not export shared types from app code.
- No implicit `any` from untyped external imports — add types or shim them explicitly.

---

## Dependency Rules

**Approved PDF/utility libraries:**
- `pdf-lib` — PDF creation and manipulation
- `pdfjs-dist` — PDF parsing and rendering
- `canvas` or equivalent — local rasterizer for PDF-to-image
- `jszip` — packaging multi-file output as ZIP
- `sharp` (optional) — local image processing

**Banned dependency categories:**
- External PDF API SDKs or cloud conversion services
- Analytics (Google Analytics, Amplitude, Mixpanel, PostHog, Heap, etc.)
- Error monitoring that phones home (Sentry, Bugsnag, Rollbar, etc.)
- Telemetry or usage tracking packages
- Any package documented as sending data to a remote server during normal operation

**Before adding any new dependency:** verify it makes zero network calls during PDF operations. Check the source or network tab if unsure.

---

## Electron Security Rules

Every `BrowserWindow` must use these exact settings:

```ts
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  preload: path.join(__dirname, 'preload.js'),
}
```

**Renderer process must not directly access:**
`fs`, `path`, `child_process`, `os`, `process`, `electron`

**Preload exposes only the 10 named PDF operations:**

```ts
window.privatePdf = {
  mergePdfs,
  splitPdf,
  reorderPages,
  deletePages,
  rotatePages,
  extractPages,
  imagesToPdf,
  pdfToImages,
  addWatermark,
  removeMetadata,
}
```

Do not expose generic methods like `readFile(anyPath)`, `writeFile(anyPath)`, or `executeCommand(cmd)`. Those are too powerful and defeat the security model.

**Navigation rules:**
- Block `window.open` by default
- Block navigation away from the app URL
- Do not load remote URLs in the main `BrowserWindow`
- External links (docs, GitHub) open in the user's default browser via `shell.openExternal`, only on explicit user action

---

## Privacy Rules

During any operation, the app must not log or transmit:

- File contents or binary data
- Filenames or file paths
- Document metadata (author, title, subject, keywords, etc.)
- Page count, file size, or any document property
- User actions or operation history
- Output filenames or export paths

`console.log` in development is acceptable. Production builds must not expose sensitive document data in any log output, error message, or network request.

---

## File Validation Rules

Validate before processing — never trust user input:

| Input | Checks |
|---|---|
| PDF file | Extension is `.pdf` AND MIME is `application/pdf` AND file starts with `%PDF-` magic bytes AND size ≤ 100 MB |
| Image file | Extension is `.jpg/.jpeg/.png` only (no SVG) AND MIME matches AND size ≤ 20 MB |
| Page range input | Positive integers only, within document page count, start ≤ end |
| Watermark text | Non-empty, max 100 characters |
| Output filename | Sanitized, no path traversal characters |

All size limits are defined in `packages/shared-types/src/constants.ts` as `FILE_LIMITS`. Reference the constant, never a hardcoded number.

```ts
export const FILE_LIMITS = {
  maxSinglePdfSizeBytes: 100 * 1024 * 1024,
  maxTotalInputSizeBytes: 250 * 1024 * 1024,
  maxMergeFileCount: 50,
  maxPdfPageCount: 1000,
  maxSingleImageSizeBytes: 20 * 1024 * 1024,
  maxImageCount: 100,
}
```

Do not accept SVG images in v1. SVG can contain embedded scripts and external references.

---

## Error Handling Rules

**Never expose raw errors to users.** The following must never appear in the UI:

```
TypeError: Cannot read properties of undefined
PDFDocument.load failed at object stream
ENOENT: no such file or directory
```

**Every operation returns a typed result:**

```ts
interface PdfOperationResult {
  status: 'success' | 'error'
  fileName?: string
  mimeType?: 'application/pdf'
  data?: Uint8Array
  error?: SafeOperationError
}

interface SafeOperationError {
  code: string           // machine-readable: 'PDF_PARSE_FAILED'
  userMessage: string    // shown in UI: "We could not process this PDF..."
  developerMessage?: string  // internal only, never rendered
}
```

**Approved user-facing error templates (use these exactly):**

- General failure: `"We could not process this PDF. The file may be corrupted, encrypted, or unsupported. Your file was not uploaded anywhere."`
- File too large: `"This file is too large for the current version. Try a smaller PDF or split the document first."`
- Invalid page range: `"Please enter valid page ranges. Example: 1-3, 5, 8-10."`
- All pages deleted: `"A PDF must contain at least one page. Please leave at least one page selected."`

On any failure: clean up temp files, reset the UI to idle, log the developer message internally, and never hang.

**Error codes** (use consistently across pdf-core):
`INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `PDF_PARSE_FAILED`, `PDF_ENCRYPTED_UNSUPPORTED`, `INVALID_PAGE_RANGE`, `NO_PAGES_SELECTED`, `ALL_PAGES_DELETED`, `IMAGE_PARSE_FAILED`, `OPERATION_FAILED`

---

## Temporary File Rules

When server-side temp files are needed:

- Use `os.tmpdir()` as the base directory
- Create a unique subdirectory per operation: `path.join(os.tmpdir(), 'private-pdf', crypto.randomUUID())`
- Delete the subdirectory after the operation completes (success or failure) — in a `finally` block
- Delete temp files on app/server close where possible
- If temp file cleanup fails, log the error internally and continue — do not crash or surface it to the user

---

## Network Policy

**Local web app:** `http://localhost:<port>` only at runtime. No external domains.

**Static check — CI must fail if any of these patterns appear in src/ outside of comments:**

```
fetch("https://
fetch('https://
axios.get("https://
axios.post("https://
navigator.sendBeacon
new XMLHttpRequest
```

**Asset bundling:** All fonts, icons, scripts, and CSS must be bundled locally at build time. No CDN links at runtime (no Google Fonts, no jsDelivr, no unpkg).

**Desktop app:** No remote URLs loaded in `BrowserWindow`. Update checks and external links are out of scope for v1.

---

## UI/UX Rules

- Every drag-and-drop upload zone must also have a standard `<input type="file">` fallback — drag-and-drop is enhancement only
- Display this trust badge on every tool page: `"Files are processed locally on your device."`
- Disable the action button while an operation is in progress — prevent duplicate submissions
- Every loading state must have a timeout; no indefinite spinners
- Use the canonical copy from `idea.md §19` for home page, empty state, processing state, success, and error messages — do not rewrite these

**Home page copy (exact):**
```
Private PDF tools that run on your device.

No uploads. No accounts. No cloud processing.

Choose a tool and process your files locally.
```

---

## Accessibility Rules

- Every interactive element is reachable and operable by keyboard
- No `outline: none` or `outline: 0` without providing a visible replacement focus style
- Every `<input>`, `<button>`, and `<select>` has a visible label or `aria-label`
- Error messages are associated with their field via `aria-describedby`
- Drag-and-drop interactions announce state changes to screen readers via `aria-live` regions

---

## Testing Rules

- Unit tests are required for every public function in `packages/pdf-core`
- Tests must not make network calls — no `fetch`, no `http`, no external URLs
- Use real PDF fixtures in tests, not mocked pdf-core functions
- Privacy CI check: a grep test must fail the build if banned fetch patterns appear in source
- Electron tests must verify: `nodeIntegration === false`, `contextIsolation === true`, renderer cannot access `fs` directly

**What to test in pdf-core:**
merge valid PDFs, reject invalid PDF, split by range, reject invalid page range, reorder pages, delete selected pages, prevent deleting all pages, rotate selected pages, extract selected pages, convert images to PDF, add text watermark, remove metadata fields

---

## What NOT to Build in v1

Hard stop. Do not add any of the following, even if they seem small or harmless:

- User accounts, login, or authentication
- Cloud storage or document sync
- Document history or recent files list
- AI features or OCR
- Analytics or event tracking of any kind
- Crash reporting that phones home
- Browser extension
- Mobile app
- Image watermarks (text only in v1)
- E-signatures
- Redaction (bad redaction leaks the original text — do not ship it)
- PDF to Word / Word to PDF
- Advanced compression
- Collaboration or team features

These may sound useful. They weaken the trust promise. The strongest version of this product is: open it, drag a file, process locally, export, done.

---

## Build Order

Follow the milestones in order. Do not skip ahead.

**Milestone 1 — Core local proof:**
Monorepo + pnpm workspace, `packages/pdf-core`, `packages/shared-types`, `apps/local-web`, Merge PDFs, Split PDF, Rotate Pages, privacy UI copy, zero external API calls. A technical user can clone, run one command, and process PDFs offline.

**Milestone 2 — All 10 features in local-web:**
Complete all 10 tools in the Next.js app. All work locally through the browser.

**Milestone 3 — Electron desktop app:**
Electron shell using `packages/pdf-core`, secure preload bridge, all 10 features, offline usage. A non-technical user can download, open, use all tools, and export results.

Do not build the Electron app until Milestone 2 is complete and all 10 features work in local-web.

---

## pdf-core Public API

These are the only 10 public functions `packages/pdf-core` exposes. Implement exactly these signatures:

```ts
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
```

Do not add convenience wrappers, class-based alternatives, or alternative calling conventions. Keep the API surface small and consistent.

---

## Developer Commands

```bash
pnpm install          # install all workspace dependencies
pnpm dev:web          # run local-web dev server
pnpm dev:desktop      # run Electron in dev mode
pnpm build:web        # production build of local-web
pnpm build:desktop    # package Electron app
pnpm test             # run all tests
pnpm lint             # lint all packages
pnpm typecheck        # TypeScript check across workspace
```

Node.js LTS. Package manager: pnpm. Workspace protocol: `workspace:*` for internal package references.
