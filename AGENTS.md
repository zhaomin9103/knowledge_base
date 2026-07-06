# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

Frontend-only SPA for an agent platform / knowledge-base management UI (合工大 AI 辅导员). React 19 + TypeScript 6 + Vite 8 + Tailwind 4 + Radix UI + React Router 7. There is no backend in this repo — all data is mocked in `src/mocks/`.

User-facing strings are Simplified Chinese; match that when adding UI text.

## Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # tsc -b && vite build  — TS errors block the build
npm run lint     # eslint .
npm run preview  # serve ./dist locally
```

There is no test framework configured. If asked to add tests, set up Vitest + React Testing Library and add scripts; do not invent commands that don't exist.

Path alias: `@/*` → `./src/*`. Always import via `@/...` to match the surrounding code.

## TypeScript constraints that bite

`tsconfig.app.json` enables several options that change what compiles:

- `verbatimModuleSyntax: true` — import types with `import type { Foo } from "..."`. A plain `import { SomeType }` used only in type position fails.
- `erasableSyntaxOnly: true` — no TS enums, no parameter properties, no namespaces. Use `as const` unions instead of enums (the codebase already does this everywhere, e.g. `KBRole`, `ReviewStatus`, `OperationType`).
- `noUnusedLocals` / `noUnusedParameters` — unused symbols fail the build, not just lint. Prefix intentionally unused parameters with `_`.

ESLint runs `typescript-eslint` + `react-hooks` + `react-refresh/vite`. `react-refresh` rejects mixed exports from component files (only export components), which is why hooks/context (`use-auth.tsx`, `use-theme.tsx`) live in their own files.

## Architecture

### Routing

Single `createBrowserRouter` tree in `src/router.tsx`, all routes nested under `AppLayout`:

- `/plaza` — landing
- `/workspace/{agents,workflows,plugins,knowledge,skills,database,models}` — workspace pages
- `/workspace/knowledge/:id` — knowledge base detail (the most-developed feature)

`AppLayout` (`src/components/layout/app-layout.tsx`) renders `PrimarySidebar` + (collapsible) `SecondarySidebar` from `PRIMARY_MENU` in `src/config/menu.ts`. Adding a workspace page = create the page, add a route, append to `PRIMARY_MENU.children`.

Netlify SPA fallback (`netlify.toml`) rewrites `/*` → `/index.html`; deep links work in production.

### Providers and global state

`main.tsx` → `<StrictMode>` → `App` → `ThemeProvider` (`use-theme.tsx`, `light`/`dark`, persisted to `localStorage` key `agent-platform-theme`, toggles `.dark` on `<html>`) → `AuthProvider` (`use-auth.tsx`, holds the mock `currentUser`) → `RouterProvider`.

There is no global store. Page-level state lives in `useState`/`useMemo` inside each page.

### Mock data layer

`src/mocks/*.ts` are the source of truth for entities:

- `users.ts` — `MOCK_USERS` pool, used by `AuthProvider`.
- `knowledge.ts` — `KNOWLEDGE_BASES[]` with `ownerId / adminIds[] / maintainerIds[]` driving permissions.
- `reviews.ts` — `REVIEW_REQUESTS[]`, status `pending|approved|rejected`, operation `add|update|delete`.
- `versions.ts` — **derived** from approved reviews via `deriveVersions(kbId)`; do not edit version history directly, write to reviews and let it derive.
- `documents.ts`, `document-contents.ts`, `kb-members.ts`, `operations.ts` — keyed by `kbId`.

When adding a feature, prefer extending these mocks (and the corresponding `*Tab` component) over inventing new shapes.

### Permissions: `useKBRole`

`src/hooks/use-kb-role.ts` is the single source of permission truth in the UI. It returns role + capability booleans:

| Role | `canManageMembers` | `canReview` | `canSubmit` |
|---|---|---|---|
| `owner` (创建者) | ✓ | ✓ | |
| `admin` (管理员) | | ✓ | |
| `maintainer` (维护人员) | | | ✓ |

`KnowledgeDetailPage` builds its tab list from these flags — that's the pattern to follow when gating other UI. The demo-only `RoleSwitcher` (`src/components/demo/role-switcher.tsx`) lets you swap `currentUser` to test each role; it should be removed when wiring a real backend.

### Knowledge-base detail page

`src/pages/workspace/knowledge-detail.tsx` is a tabbed shell that mounts one of seven feature components under `src/pages/workspace/knowledge-detail/`:

`documents-tab` · `my-submissions-tab` · `pending-review-tab` · `version-history-tab` · `review-records-tab` · `audit-log-tab` · `members-tab`

Several have an `*-enhanced.tsx` sibling — these are the **upgraded** designs from `DESIGN_UPGRADE.md` (cards instead of tables, gradients, larger radii, `font-serif` headings). The plain versions are still imported by `knowledge-detail.tsx`. When upgrading a tab, follow the enhanced naming/pattern; when editing an already-enhanced view, mirror that style.

### UI components

`src/components/ui/` holds shadcn-style Radix wrappers (`button`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `textarea`), each with a `cva` variants object. There is a parallel `dialog-enhanced.tsx` matching the design upgrade — prefer it inside enhanced flows. Compose classes with `cn()` from `src/lib/utils.ts` (`clsx` + `tailwind-merge`).

### Styling

Tailwind v4 via `@tailwindcss/vite`; tokens live in `src/index.css` (`@theme` block + CSS vars on `:root` / `.dark`). Brand palette is `brand-50…900`. Dark mode is class-based (`@custom-variant dark (&:is(.dark *))`), driven by `ThemeProvider`. Use the CSS-var-backed Tailwind utilities (`bg-card`, `text-muted-foreground`, `border-border`, `bg-brand-500`) rather than raw hex.

## Deployment

Netlify, auto-deploy from `main` (config in `netlify.toml` — build `npm run build`, publish `dist`). Env vars must be prefixed `VITE_` to reach the client. See `DEPLOYMENT.md` for the manual UI steps.
