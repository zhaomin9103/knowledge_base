# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frontend-only SPA for a knowledge-base management system (合工大 AI 辅导员 - 知识库管理). React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + Radix UI + React Router 7. **There is no backend** — all data is mocked in `src/mocks/`.

**Language**: All user-facing text is Simplified Chinese. Match this when adding UI text or error messages.

## Commands

```bash
npm run dev      # Start Vite dev server at http://localhost:5173
npm run build    # TypeScript compilation + Vite build (TS errors block the build)
npm run lint     # Run ESLint
npm run preview  # Serve ./dist locally after build
```

**Note**: There is no test framework configured. If tests are needed, set up Vitest + React Testing Library first.

## Architecture

### Core Domain: Multi-Level Review System

The application implements a **4-role, 2-stage review workflow** for knowledge base document management:

**Roles** (from lowest to highest authority):
- **Maintainer** (`maintainer`): Can submit changes, requires first review
- **First Reviewer** (`firstReviewer`): Can approve/reject submissions with **terminal decision power** (can choose "approve & apply" or "approve & submit to second review")
- **Second Reviewer** (`secondReviewer`): Highest review authority, can approve/reject second-stage reviews. **Their own submissions apply immediately without review**
- **Owner** (`owner`): Creator of the knowledge base. Has first-review authority + member management. Treated as first reviewer in "My Submissions" tab (shows full review status)

**Review Flow States** (`ReviewRequest.status`):
- `pending_first` → awaiting first review
- `pending_second` → first review passed, awaiting second review
- `approved` → finally approved and applied (version generated)
- `rejected` → rejected at any stage

**Key Business Rules**:
1. **First reviewer has terminal decision power**: Can choose to apply directly or submit to second review
2. **Document locking during review**: Documents under review (`pending_first`/`pending_second`) cannot be modified
3. **Owner ≠ Pure Second Reviewer**: Owners are treated as first reviewers in "My Submissions" tab to show full review process
4. **Second reviewers' operations apply immediately**: No review dialogs, direct effect
5. **Optimistic locking**: Each `ReviewRequest` has a `version` field to prevent concurrent modification

### Data Model

**Knowledge Base Configuration** (`KNOWLEDGE_BASES`):
```typescript
{
  ownerId: string               // Creator
  secondReviewerIds: string[]   // Second reviewers
  firstReviewerIds: string[]    // First reviewers  
  maintainerIds: string[]       // Maintainers
  currentVersion: number        // Version counter
}
```

**Review Request** (`REVIEW_REQUESTS`):
```typescript
{
  status: "pending_first" | "pending_second" | "approved" | "rejected"
  skipFirstReview?: boolean     // Submitter is first reviewer, skip first stage
  firstReview?: {
    result: "approved" | "rejected"
    skipSecondReview?: boolean  // First reviewer chose "approve & apply"
    reason?: string
  }
  secondReview?: {
    result: "approved" | "rejected"
    reason?: string
  }
  appliedVersion?: number       // Version number when approved
  version: number               // Optimistic lock version
}
```

### Key Differentiation Logic

**Pure Second Reviewer Detection**:
```typescript
// Used throughout to differentiate pure second reviewers from owners
const isPureSecondReviewer = isSecondReviewer && !isOwner
```

This distinction is critical for:
- "My Submissions" tab: Pure second reviewers hide review status/details columns
- Document operations: Pure second reviewers bypass review dialogs
- UI simplification: Pure second reviewers see simplified views

### Page Structure

**Main Route**: `/workspace/knowledge/:id` → `knowledge-detail.tsx`

**Dynamic Tab System**: Tabs shown based on role via `useKBRole(kbId)` hook:
- Owner: Documents · My Submissions · Pending First Review · Version History · Review Records · Audit Log · Members
- Second Reviewer: Documents · My Submissions · Pending Second Review · Version History · Review Records · Audit Log
- First Reviewer: Documents · My Submissions · Pending First Review · Version History · Review Records · Audit Log
- Maintainer: Documents · My Submissions

**Key Components**:
- `documents-tab.tsx` - File list with update/delete operations
- `my-submissions-tab.tsx` - **Role-differentiated display**: Pure second reviewers hide status columns, others show full review status including approved records (v4.0 change)
- `pending-first-review-tab.tsx` - First review queue with 3-button action (approve & apply / approve & submit to second / reject)
- `pending-second-review-tab.tsx` - Second review queue
- `review-records-tab.tsx` - All review records including **in-review status** showing real reviewer names (v4.0 change)
- `approval-timeline.tsx` - **Reusable approval flow timeline component** (v4.0 addition), used in flow dialog and detail dialog
- `approval-flow-dialog.tsx` - Shows **dynamic approval nodes** (doesn't show second review node prematurely)

### Approval Flow Timeline Logic (v4.0)

The `ApprovalTimeline` component dynamically decides whether to show the second review node:

```typescript
// Show second review node ONLY when:
const shouldShowSecondReview = 
  !firstRejected && 
  (review.secondReview || review.status === "pending_second")

// Do NOT show when:
// - Still in first review (pending_first)
// - First review rejected
// - First review approved directly (skipSecondReview === true)
```

**Special display for direct approval**:
- Title: "初审通过（直接生效）" 
- Description includes applied version: `v13`

### Role Permission Hook

`useKBRole(kbId)` in `src/hooks/use-kb-role.ts` returns:
- `role`: "owner" | "first_reviewer" | "second_reviewer" | "maintainer" | null
- `isOwner`, `isFirstReviewer`, `isSecondReviewer`, `isMaintainer`: boolean flags
- `canFirstReview`: owner || first reviewer
- `canSecondReview`: owner || second reviewer  
- `canSubmit`: any role can submit
- `canManageMembers`: owner only
- `skipsFirstReview`: first reviewer or higher (submitter can skip first stage)

### Mock Data Management

All data lives in `src/mocks/`:
- `knowledge.ts` - Knowledge base configurations (roles, members)
- `reviews.ts` - Review requests (27 records including direct approval scenarios)
- `users.ts` - User data
- `document-contents.ts` - Document content for diff display

When adding review records, follow the pattern:
- Use `skipFirstReview: true` for first reviewer/owner submissions
- Use `firstReview.skipSecondReview: true` for direct approval (no second review)
- Increment `appliedVersion` sequentially for approved records

## Styling & UI

**Tailwind v4** via `@tailwindcss/vite`. Tokens in `src/index.css`:
- Brand palette: `brand-50` through `brand-900`
- Dark mode via CSS class (`.dark`), managed by `ThemeProvider`
- Use semantic CSS variables: `bg-card`, `text-muted-foreground`, `border-border`, `bg-brand-500`

**UI Components** in `src/components/ui/`:
- Radix UI wrappers with `cva` variants
- Use `cn()` from `src/lib/utils.ts` to merge classes
- `dialog-enhanced.tsx` exists for upgraded designs

## TypeScript Constraints

**React 19 + TS 6**: `children` is no longer implicit in component props. Always declare explicitly:
```typescript
interface Props {
  children: React.ReactNode  // Required
}
```

**Path alias**: `@/*` → `./src/*`. Always use this for imports to match codebase style.

## Project Evolution

**Current Version**: v4.0 (UI Optimization & Second Reviewer Direct Apply)

Key changes in v4.0:
- Second reviewers' operations (import/update/delete) apply immediately without review dialogs
- Owner treated as first reviewer in "My Submissions" tab
- "My Submissions" shows all records including approved ones
- Review records show real reviewer names for in-review items
- Approval timeline dynamically shows nodes (no premature second review node)
- Detail dialog bottom includes approval timeline

See `docs/CHANGELOG-v4.0.md` for full details.

## Important Files

- `docs/PRD-知识库详情页.md` - Complete product requirements (v4.0)
- `docs/HANDOVER.md` - Quick reference for core changes
- `src/hooks/use-kb-role.ts` - Role permission logic
- `src/pages/workspace/knowledge-detail/approval-timeline.tsx` - Reusable approval flow component (v4.0)
- `src/mocks/reviews.ts` - Review workflow data (includes direct approval scenarios)

## Deployment

Netlify auto-deploy from `main` branch:
- Build command: `npm run build`
- Publish directory: `dist`
- Config: `netlify.toml`
- Environment variables must be prefixed with `VITE_` to be accessible client-side
