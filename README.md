# PrivatePDF

PDF tools that run entirely on your device. No uploads, no accounts, no internet required.

**[Download the desktop app](https://olagokemills.github.io/document-toolbox)** · [All releases](https://github.com/olagokemills/document-toolbox/releases)

---

## What it does

PDF and image tools that work 100% locally:

| Category | Tools |
|---|---|
| Organise | Merge, Split, Rotate, Delete pages, Extract pages, Reorder pages |
| Enhance | Watermark, Remove metadata, Lock, Unlock |
| Convert to PDF | Word → PDF, Excel → PDF, PowerPoint → PDF, HTML → PDF, Images → PDF |
| Convert from PDF | PDF → Word, PDF → Excel, PDF → PDF/A, PDF → Images, PDF → PowerPoint |
| Image tools | Compress, Resize, Crop, Rotate/Flip, Convert, Remove metadata, Watermark, Blur/Pixelate, Meme maker, Adjust |

---

## Run locally (web app)

No installation needed — runs in your browser via Next.js.

**Prerequisites:** Node 20+, pnpm 9+

```bash
git clone https://github.com/olagokemills/document-toolbox.git
cd document-toolbox
pnpm install
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000).

---

## Run the desktop app in dev mode

```bash
pnpm dev:desktop
```

Opens an Electron window with hot reload.

---

## Build the desktop installer

```bash
# macOS — produces apps/desktop/dist/PrivatePDF.dmg
pnpm package:desktop
```

> **Note:** macOS and Windows installers must be built on their respective platforms. The CI release workflow handles cross-platform builds automatically on tag push.

---

## Release a new version

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions builds the `.dmg` (macOS) and `.exe` (Windows) and attaches them to the release automatically.

---

## Project structure

```
apps/
  local-web/        Next.js web app
  desktop/          Electron desktop app
packages/
  pdf-core/         Portable PDF validation and byte transformations
  image-core/       Shared local JPG, PNG, and WebP processing
  shared-types/     TypeScript types and constants
website/            Static download landing page (GitHub Pages)
```

### Architecture boundary

Runtime-independent PDF parsing, validation, and byte transformations live in `pdf-core` and are
shared by both apps. Rendering that specifically requires browser Canvas, Puppeteer, or Electron's
print engine stays in a narrow platform adapter. These adapters block external resource loading and
must not duplicate portable transformations.

The Electron renderer never receives raw filesystem paths or generic file read/write methods. Files
selected by the user are represented by opaque handles and can only be used with named operations.

---

## Development commands

| Command | Description |
|---|---|
| `pnpm dev:web` | Start the web app (port 3000) |
| `pnpm dev:desktop` | Start the desktop app |
| `pnpm test` | Run all tests |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm build:web` | Production build of the web app |
| `pnpm build:desktop` | Production build of the desktop app |
| `pnpm package:desktop` | Build + package desktop installer |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, branch model, and PR guidelines.

## License

MIT
Made with love for all
