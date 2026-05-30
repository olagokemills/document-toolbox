# Contributing to PrivatePDF

Thanks for your interest in contributing! This document covers how to get set up, how work is organised, and what we expect in pull requests.

## Monorepo layout

```
apps/
  local-web/          Next.js web app (self-hostable)
  desktop/            Electron desktop app
packages/
  pdf-core/           All PDF logic — shared between both apps
  shared-types/       TypeScript types and constants
website/              Static download landing page (GitHub Pages)
```

## Dev setup

**Prerequisites:** Node 20+, pnpm 9+

```bash
# Install dependencies (all workspaces)
pnpm install

# Start the web app (http://localhost:3000)
pnpm dev:web

# Start the desktop app (opens Electron window)
pnpm dev:desktop
```

## Common commands

| Command | What it does |
|---|---|
| `pnpm test` | Run all tests (vitest, pdf-core) |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm build:web` | Production build of the web app |
| `pnpm build:desktop` | Production build of the desktop app |
| `pnpm package:desktop` | Build + package to `.dmg` / `.exe` |

All commands must pass before a PR can merge.

## Branch model

- `main` is the stable branch — it is protected and requires a passing CI run + one approval
- Do all work on a feature branch: `feat/my-feature`, `fix/the-bug`, `chore/update-deps`
- Open a pull request against `main`; keep PRs focused and small

## Pull request checklist

Before requesting review, confirm:

- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] New functionality is covered by tests (if in `pdf-core`)
- [ ] PR description explains **what** changed and **why**

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add password-protect tool
fix: correct page count after split
chore: update electron to v36
docs: add Windows build instructions
```

The type (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`) is mandatory. Keep the subject line under 72 characters.

## Where to add PDF tools

All PDF processing logic lives in `packages/pdf-core/src/`. Each tool is a pure TypeScript function that takes `Uint8Array` inputs and returns `Uint8Array` outputs. Keep Node.js-only APIs out of pdf-core — the web app runs those functions in API routes, the desktop app runs them in the Electron main process.

## Reporting bugs and requesting features

Use the [GitHub issue templates](https://github.com/olagokemills/document-toolbox/issues/new/choose).
