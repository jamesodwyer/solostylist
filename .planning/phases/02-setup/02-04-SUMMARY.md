---
phase: 02-setup
plan: "04"
subsystem: ui
tags: [react, next.js, supabase, server-actions, tabs, sheet, crm]

requires:
  - phase: 02-03
    provides: client list, client model with tags, client-row tag chip pattern

provides:
  - Client detail page at /clients/[id] with Details, Notes, Colour tabs
  - Server Actions for notes CRUD (addNote, updateNote, deleteNote)
  - Server Actions for colour formula CRUD (addColourFormula, updateColourFormula, deleteColourFormula)
  - Server Actions for tag management (createTag, addTagToClient, removeTagFromClient)
  - Inline editable client contact fields with blur/Enter save
  - Marketing consent toggle
  - Tag picker with existing tag selection and create-on-fly
  - Reverse-chronological notes timeline with type badges (General, Treatment, Colour Formula)
  - Floating FAB with note type menu on Notes tab
  - Colour formula dedicated tab with formula text (mono font) and optional notes

affects:
  - 03-booking (notes/colour formulas available during booking flow)
  - future client search (tags available for filtering)

tech-stack:
  added: []
  patterns:
    - Server Actions with getUser() + redirect('/login') auth guard pattern
    - useTransition for non-blocking Server Action calls with loading states
    - Inline edit: editingField state + blur/Enter to save, one field at a time
    - Timeline merging: notes + colour formulas sorted by created_at descending
    - FAB with popover menu above it for multiple action types
    - Tag colour determinism: sum char codes mod palette length

key-files:
  created:
    - src/lib/actions/notes.ts
    - src/lib/actions/tags.ts
    - src/app/(app)/clients/[id]/page.tsx
    - src/components/clients/detail/client-detail-tabs.tsx
    - src/components/clients/detail/details-tab.tsx
    - src/components/clients/detail/tag-picker.tsx
    - src/components/clients/detail/note-sheet.tsx
    - src/components/clients/detail/notes-tab.tsx
    - src/components/clients/detail/colour-tab.tsx
  modified: []

key-decisions:
  - "Colour formulas stored in separate table (colour_formulas) but merged into notes timeline on Notes tab — dedicated view on Colour tab shows them in isolation"
  - "Tag picker uses upsert on createTag to handle duplicate names gracefully — returns the existing tag row if name already exists for that user"
  - "FAB menu uses a popover div above the button rather than a modal/sheet to keep interaction snappy"
  - "window.confirm() for delete confirmation — simple and effective for MVP"
  - "Inline edit saves on blur or Enter key; Escape cancels without saving"

patterns-established:
  - "Timeline entry: merge two arrays, add source discriminator, sort by created_at descending"
  - "NoteSheet: single shared component for add/edit of both note types and colour formulas, controlled by mode prop"
  - "getTagColor(name): deterministic colour from TAG_PALETTE by summing char codes mod palette length — shared between client-row.tsx and tag-picker.tsx (duplicated, not extracted yet)"

requirements-completed:
  - CLNT-04
  - CLNT-05
  - CLNT-06
  - CLNT-07
  - CLNT-08

duration: 3min
completed: "2026-03-01"
---

# Phase 2 Plan 4: Client Detail Page Summary

**Full client CRM detail view — three-tab page with inline editing, tag chips, reverse-chronological notes/colour formula timeline, and floating FAB for adding all note types**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T23:12:41Z
- **Completed:** 2026-03-01T23:15:49Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Client detail page at `/clients/[id]` fetches client, notes, colour formulas, and all tags server-side
- Details tab: inline edit for all contact fields (blur/Enter to save), marketing consent toggle, tag chips with remove, tag picker with dropdown and create-on-fly
- Notes tab: merged timeline of general notes, treatment notes, and colour formulas with type badges; floating FAB with three-option menu; individual edit/delete actions
- Colour tab: dedicated colour formula list with formula in monospace, optional notes, edit/delete, and FAB for adding
- Complete Server Actions suite: notes.ts (6 exports), tags.ts (3 exports) — all auth-guarded with getUser() + redirect pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Server Actions for notes, colour formulas, tags, and client detail page** - `73f5067` (feat)
2. **Task 2: Client detail tabs, notes timeline, colour tab, and tag picker** - `3bc700b` (feat)

## Files Created/Modified

- `src/lib/actions/notes.ts` - addNote, updateNote, deleteNote, addColourFormula, updateColourFormula, deleteColourFormula Server Actions
- `src/lib/actions/tags.ts` - createTag (upsert), addTagToClient (graceful duplicate handling), removeTagFromClient Server Actions
- `src/app/(app)/clients/[id]/page.tsx` - Server Component: fetches client with tags, notes, colour formulas, allTags; renders ClientDetailTabs
- `src/components/clients/detail/client-detail-tabs.tsx` - Tabs container (Details/Notes/Colour) using shadcn Tabs
- `src/components/clients/detail/details-tab.tsx` - Inline editable contact fields, marketing consent toggle, tag chips, TagPicker
- `src/components/clients/detail/tag-picker.tsx` - Combo input with filtered dropdown; select existing or create new tag
- `src/components/clients/detail/note-sheet.tsx` - Bottom sheet for adding/editing notes and colour formulas, mode-switched
- `src/components/clients/detail/notes-tab.tsx` - Merged timeline with type badges, floating FAB with popover menu, edit/delete per entry
- `src/components/clients/detail/colour-tab.tsx` - Colour formula list with monospace formula text, optional notes, edit/delete, FAB

## Decisions Made

- Used `upsert` on `createTag` with `onConflict: 'owner_user_id,name'` so creating a tag that already exists returns the existing row — no error thrown
- `addTagToClient` handles Postgres unique constraint error code `23505` as a success (client already has tag = idempotent)
- `getTagColor` duplicated in `tag-picker.tsx` and exported for use in `details-tab.tsx` rather than extracting to shared util — acceptable for MVP
- Notes tab merges colour formulas into timeline for a unified "what happened" view; Colour tab provides dedicated formula lookup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - build succeeded on first attempt after all files were created.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Client detail page fully operational: view, edit, note, tag workflows complete
- Notes and colour formulas will be available as context during Phase 3 booking flow
- Tag system ready for filtering/searching in future plans

---
*Phase: 02-setup*
*Completed: 2026-03-01*
