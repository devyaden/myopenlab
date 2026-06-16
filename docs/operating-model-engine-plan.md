# Operating Model Engine — making a March-style document dynamic & agent-editable

> Plan for future sessions. Read this top-to-bottom before touching code. It supersedes the earlier
> "launch sprint" plan (that work is done: Playbook rename, /try, onboarding, PostHog, pricing, and the
> workspace AI agent are all shipped). This plan is about the **next product chapter**.

## Context

The North Star is now concrete. The reference is the attached **March Operating Model** deck (206 pages):
a company's entire operating model expressed as **process maps (BPMN-style flows) + tables (Activities,
RACI, Deliverables) + sub-documents (Templates, Policies, Standards, Checklists, Authority matrices) +
org charts + capability maps**, all **cross-referenced by stable human-readable IDs** (a step `HR-01.04`
references template `TMPL01-HR-01` and policy `PLCY01-HR-01`; processes chain `HR-01 → HR-02 → HR-03`).

The goal: let a user — via the in-app **AI agent** — author and continuously edit a living version of exactly
that. One document that contains **live flows, live tables, and linked sub-documents**, where editing the
source updates every embed, and the whole web of references stays intact as things change.

**What we already have (confirmed in code):** the document editor (`components/editor/index.tsx`, Tiptap)
already embeds **live canvas flows** (`extensions/ReactFlowNode.tsx` — refs a `canvasId`, fetches
`/api/canvas/data/[id]`, `useRealTimeData` flag) and **live tables** (`extensions/CanvasTableNode.ts` —
refs a `tableId`, `isDynamic`, with filter/sort/column-projection). It has `@` file-mentions
(`extensions/FileMention.ts`), a `/` slash menu (`extensions/SlashCommands.ts`), headings/lists/colors/
RTL, float blocks, native tables, page setup. Relation + rollup columns exist as a linking primitive.

**The three gaps that block the vision:**
1. **The agent can't touch documents.** `lib/agent/tools.ts` only has `propose_create_canvas` /
   `propose_update_canvas`; `app/api/ai/agent/apply/route.ts` only writes `canvas_data` (nodes/edges).
   There is **no path** to author/edit `document_data.lexical_state` or to place embeds. This is the headline gap.
2. **No ID / cross-reference spine.** Everything is UUIDs. The only linking primitive (relation/rollup
   columns) is keyed on fragile, regenerated `node.id`s. The March doc's entire value is the ID web.
3. **Foundation is shaky.** The table view has real bugs (below), persistence is inconsistent
   (canvas auto-saves; tables/docs need manual Save), and there's console/security debt.

**Decisions locked with the product owner:**
- **IDs are first-class and agent-assigned** — stable internal UUID + an auto-assigned human code
  (`HR-01`, `TMPL01-HR-01`, `PLCY01-CE`) + a real cross-reference engine with backlinks; references survive edits.
- **Sub-documents embed as live "reference cards"** (title, owner, ID, last-edited, click-through — like the
  March metadata slides); **flows and tables transclude live** (already supported).
- **Foundation first** — fix the table/persistence/ID base, then build agent document-authoring on top.

---

## Target artifact, decomposed (March element → app primitive → status)

| March deck element | App primitive to use | Status today |
|---|---|---|
| Process map / BPMN flow (swimlanes, decisions, loops) | Canvas (hybrid) embedded via `ReactFlowNode` | ✅ exists; swimlanes/pools partial |
| Activities / Deliverables / RACI tables | Canvas (table view) embedded via `CanvasTableNode` (`isDynamic`) | ✅ exists; table-view buggy |
| Template / Policy / Standard / Checklist pages | A Document (`document_data`) surfaced as a **reference-card embed** | ⚠️ docs exist; no card embed, no agent authoring |
| ID scheme `VAL-BP#.SBP/Act/Stp` + prefixes `TMPL/PLCY/STND/CHKL/AUTH` | New **code + reference** layer (Phase 2) | ❌ none |
| Cross-references (`HR-01.04` → `TMPL01-HR-01`) | Typed references + `@`-mentions to step/template/policy/person | ⚠️ @ links files only |
| Org charts / hierarchy / capability map | Canvas (hierarchy/mindmap diagram types) | ✅ exists |
| Operating-model "page" per process (flow + 4 tables + templates) | A **composite Document** scaffolded by the agent | ❌ the headline build |

The whole March HR-01 unit = **one Document** ("Recruitment & Selection") that embeds: the BPMN flow
(live canvas), the Activities table, the RACI table, the Deliverables table (live tables), and reference
cards for `TMPL01..04-HR-01` / `STND01-HR-01` / `PLCY01-HR-01` — every piece carrying its ID and
cross-links. That composite Document, authored and editable by the agent, is the deliverable.

---

## Phase 0 — Hygiene, correctness & security (fix list; do first, low-risk)

Goal: a calm console and a table view that doesn't lose data — prerequisites for everything else.

**STATUS: ✅ done + in-browser QA passed (2026-06-15).** All 7 items implemented; `tsc --noEmit` and
`next build` both pass clean.

**⚠️ Pre-deploy checklist (must do before / as part of the real prod deploy):**
1. **Rename the Vercel env var** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` (the new
   server-only code reads the non-public name). NOTE: deploying current `main` (de6ebad, old code) with the var
   renamed **fails the build** (`Error: supabaseKey is required`) — the build only succeeds once the server-only
   refactor (Phase 0.3) is on `main`. Verified: `next build` passes locally with the renamed var.
2. **Rotate the service-role key** in Supabase. It shipped in the public client bundle (the `NEXT_PUBLIC_` leak),
   so treat it as compromised; moving it server-side does not undo past exposure. Set the new value as
   `SUPABASE_SERVICE_ROLE_KEY`.
3. **Fix the Prisma version mismatch before the real deploy.** `package.json` has `prisma@6.17.1` (devDep) vs
   `@prisma/client@5.22.0` — a major mismatch that makes `prisma generate` fail in Vercel's postinstall. Align
   both to the same major (both 5.x or both 6.x). Non-blocking at runtime (runtime uses the Supabase client) but
   it's deploy noise and could surface later.

**In-browser QA results (dev server + Playwright, QA account):**
- *Table empty-column persistence* — VERIFIED. Created a Table, added column `QA_Owner` to the **row-less**
  table → a `save_canvas_transaction` RPC fired (200) and the column **survived a full reload**. Pre-fix this
  RPC would not have fired (early return). ✅
- *406s* — subscription/usage paths clean (200). QA surfaced **two additional 406 sources not in the original
  fix list**: `canvas_data` and `canvas_settings` `.single()` loads in `useCanvas.ts` (+ two related-canvas
  `.single()` in `table-view/index.tsx`) threw real **console errors** (6) on every fresh table/canvas open.
  Fixed → `.maybeSingle()`; re-verified now 200 with **0 console errors**. ✅
- *Tutorials opt-in* — the default-flip alone was insufficient: existing profiles persist
  `autoStartTutorials: true` in localStorage, and a tour DID auto-start. Added an **effect-level gate** (removed
  the auto-start `useEffect` in `custom-tooltip.tsx`); re-verified **no auto-start** despite the persisted flag,
  console clean (no "elements not ready"). ✅
- *Playbook rename* — VERIFIED live: toolbar "Insert Playbook", slash-menu "Playbook — Embed a playbook flow /
  diagram". QA surfaced **two more "New Canvas" labels** (`dashboard/folder-content.tsx`,
  `dashboard-sidebar/user-sidebar.tsx` create menus) → renamed to "New Playbook". ✅
- *ReactFlow 002 warning* — confirmed **dev-only**: a React StrictMode artifact (the `useNodeOrEdgeTypes` purity
  re-invoke emits `002` via the store's default logger before our `onError` prop propagates), gated by
  `NODE_ENV==='development'` in ReactFlow, hence **absent from the production bundle** (build clean). Benign,
  already documented in `flow-config.ts`; not a real bug. Dashboard/table/document pages show 0 console warnings.
- *Service-role key* — verified the key value appears in **0** client-static bundle files (anon key in 1).
- Pre-existing unrelated issue noted (out of Phase 0 scope): avatar fetches to `.../avatars/null|undefined`
  fail (ERR_BLOCKED_BY_ORB) for users without an avatar — a null/undefined URL construction bug.

- **✅ Table-view empty-column bug.** Real root cause differed from the original hypothesis: `column-data.ts`
  `addColumn()` already persists the column def independent of node seeding (`columns: [...columns, newColumn]`),
  and the header renders from `columns` state — so the column shows in-session. The bug was that
  `useCanvas.ts` `saveCanvas()` **returned early when `nodes.length === 0 && edges.length === 0`**, so a column
  added to a row-less table was never written to `column_definition` and vanished on reload. **Fix:** relaxed
  that guard to also require `columns.length === 0` before skipping (columns now count as content). The
  `SortableContext`/header-mismatch hypothesis (c) was a symptom of this persistence bug, not a separate render
  bug. (`lib/store/useCanvas.ts` saveCanvas guard.) Secondary cases — blank new-column label, flaky single-vs-row
  cell-edit — to be confirmed during in-browser QA.
- **✅ `.single()` → `.maybeSingle()`.** Fixed `lib/subscription-features.ts:87` plus every other 0-or-1-row
  query that legitimately returns 0 rows (free users / no AI usage / invalid promo): `app/pricing/page.tsx`,
  `lib/hooks/useSubscriptionLimits.ts` (×2), `app/api/subscription/status/route.ts`,
  `app/api/debug/subscription/route.ts`, `app/protected/profile/page.tsx`,
  `components/auth/signup-form-v2.tsx`, `components/auth/promo-code-signup.tsx`. Canvas/doc-by-id `.single()`
  calls left as-is (a 0-row there is a genuine 404, handled).
- **✅ Supabase client / security (CRITICAL leak fixed).** The service-role key was exposed as
  `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (inlined into the browser bundle) and `supabaseAdmin` was called
  directly from a **client** zustand store (`lib/store/users.ts`, used by the admin panel). **Fix:** moved
  `supabaseAdmin` to a new server-only module `lib/supabase/admin.ts` (`import "server-only"`), keyed on the
  non-public `SUPABASE_SERVICE_ROLE_KEY`; added admin-gated API routes `app/api/admin/users/route.ts`
  (GET list / POST invite) and `app/api/admin/users/[id]/route.ts` (DELETE / PATCH status) behind
  `lib/auth/require-admin.ts`; rewrote `lib/store/users.ts` to call those routes via `fetch`; removed the admin
  client from the browser-imported `lib/supabase/client.ts` (this also resolves the "Multiple GoTrueClient
  instances" warning — now a single browser client). Renamed the var in `.env.local`. **⚠️ Rename it in
  production env (Vercel) too**, else server admin ops break.
- **✅ ReactFlow nodeTypes/edgeTypes warning.** Confirmed via the installed `@reactflow/core@11.11.4` source
  that this warning is emitted through `onError('002', …)`, and the hoisted `flow-config.ts` `onReactFlowError`
  already swallows code `002`. All 6 live `<ReactFlow>` mounts already pass both the hoisted `nodeTypes/edgeTypes`
  constants **and** `onError` (incl. the doc flow-embed, which renders via `ReactFlowCanvas`), so the root cause
  (unstable refs / re-init) is already addressed. The only mounts lacking it were two **dead-code** components
  (`CanvasRenderer.tsx`, `StandaloneFlowChart.tsx`, no importers, no `nodeTypes` at all) — wired them to the
  hoisted config + `onError` for completeness. Confirm ×0 live in QA.
- **✅ Logger gate.** Added `lib/log.ts` (silent unless `NEXT_PUBLIC_DEBUG_LOGS=true`; `log.error` always
  surfaces). Routed `console.log/warn` → `log.debug/warn` in the noisy files: `subscription-features.ts`,
  `store/useCanvas.ts`, `store/useDocument.ts`, `store/useOnboarding.ts`, `posthog/utils.ts`, `posthog/index.ts`,
  `supabase/realtime-sync.ts`, `services/claude/api-client.ts`, `services/ai-usage.ts`,
  `extensions/ReactFlowNodeView.tsx`, `onboarding/custom-tooltip.tsx` (~78 calls; `console.error` left intact).
  Remaining scattered `console.log`s in less-hot components can be migrated opportunistically.
- **✅ Tutorial auto-start.** Made tutorials opt-in: defaulted `autoStartTutorials` to `false` in
  `lib/store/useOnboarding.ts` (the existing flag already gates `shouldAutoStartTutorial`, which also drives the
  completion-dialog auto-suggest). Replaced the 5s multi-element poll in `custom-tooltip.tsx`
  `waitForTutorialElements` with a single first-target wait (≤2s) so we never poll for targets that live on
  other routes — killing the "elements not ready after 5000ms" spam.
- **✅ Finish the Playbook rename.** `slash-items.tsx` "Canvas" → "Playbook" (kept `canvas` keyword for search);
  `EditorToolbar.tsx` "Insert Canvas" → "Insert Playbook"; `TableSelectorDialog.tsx` "Insert Canvas Table" →
  "Insert Table". (Phase 3 will further split these into Embed Flow / Table / Document.)

---

## Phase 1 — Unify persistence to autosave

Goal: kill the two-models surprise (canvas auto-syncs; tables/docs need manual Save + throw `beforeunload`).

- Make table view and document view **autosave** on a debounce, mirroring `useCanvas.syncChanges()`.
- Add a single, quiet **save-state indicator** ("Saving… / All changes saved") in the editor header used by
  all three views. Keep the manual Save button as an explicit version snapshot, not the contract.
- Reuse the existing transactional save (`database-functions/save-canvas-transaction.sql`) and the
  `document_data` upsert in `components/editor/hooks/useDocument.ts`.

**STATUS: ✅ done + in-browser QA passed (2026-06-15).** `tsc --noEmit` clean.

**Key finding during implementation:** autosave already existed for *both* surfaces, and all three views
already render the **same** header (`components/canvas-new/header.tsx`). The file `components/editor/Header.tsx`
is **dead code** (zero importers) — do not wire new UI there. So the real Phase 1 delta was the indicator + the
`beforeunload` cleanup, not the autosave plumbing.
- Table view shares the canvas store; `setColumns`/`setNodes` already call `syncChanges()` (2s debounce).
- Document editor (`components/editor/index.tsx`) already had `triggerAutoSave()` (2s debounce) + a
  `saveStatus` state machine; its old `renderSaveStatus()` was commented out.

**What was implemented:**
- **New shared `SaveStatusIndicator`** (`components/editor/SaveStatusIndicator.tsx`): quiet, `role="status"`,
  states `saved | saving | unsaved | error` ("All changes saved" / "Saving…" / "Unsaved changes" / "Couldn't
  save") with a last-saved hover hint. Wired into the single shared header next to the Save button, fed by:
  the document editor's existing `saveStatus` + store `lastSaved`; and for canvas/table a derived
  `saveLoading ? "saving" : isDirty ? "unsaved" : "saved"` + store `lastSaved` (the store `error` field is
  intentionally *not* mapped — it doubles as the load-error field and would show a false "couldn't save").
- **Killed the `beforeunload` confirmation-dialog surprise** in `components/editor/index.tsx` and
  `components/canvas-new/index.tsx` (removed `preventDefault()` / `returnValue`); replaced with a silent
  best-effort flush. Autosave is now the contract.
- **Flush-on-unmount for the document editor**: the unmount cleanup used to only `clearTimeout` the pending
  debounce (dropping the last <2s of edits on SPA navigation). Now a `flushPendingSaveRef` (refreshed each
  render to avoid stale closures) pushes the latest content into the store + fires `saveDocument()` —
  fire-and-forget; the zustand store outlives the component so the write completes. `saveDocument()` snapshots
  the store synchronously at its top, so a sibling document mounting right after can't redirect the write.
- Kept the manual Save buttons (now tooltip'd as an explicit version snapshot).

**In-browser QA (dev server + Playwright, QA account):**
- *Indicator on all three surfaces* — VERIFIED. Table, Document, and Canvas/diagram views all render the
  shared `role="status"` indicator ("All changes saved" + "Saved just now" hover). ✅
- *Table autosave + navigate-away-persists* — VERIFIED. Added column `QA_Phase1` to a row-less table (no rows),
  navigated to the dashboard **without clicking Save**, reopened from a fresh load → column persisted; indicator
  showed saved; **no "unsaved changes" dialog** blocked navigation. ✅
- *Document autosave + navigate-away-persists* — VERIFIED. Typed text, typed a trailing `EDIT2` and immediately
  navigated away via the in-app breadcrumb (SPA unmount) **without Save** → reopened doc contained the full
  `"...autosave EDIT2"` including the last edit, proving the flush/debounce captured it. ✅ (Test note: Playwright
  `.fill()` on the ProseMirror contenteditable does **not** register as editor input — focus the `.tiptap.ProseMirror`
  element and use `pressSequentially`/slow type, else only structural deletes persist and the doc looks empty.)
- *Console* — 0 errors across all flows; the only warnings are the **known dev-only** ReactFlow `002`
  (documented benign in Phase 0, absent from the prod build). ✅

---

## Phase 2 — Stable IDs & the cross-reference spine

Goal: the backbone that makes an Operating Model possible — every artifact has a durable identity and can
reference others, and references survive agent edits.

- **`code` on Canvas** (`prisma/schema.prisma`): nullable human-readable code (e.g. `HR-01`), unique per
  workspace. Function prefix derives from the value-chain function; serial auto-increments. Agent assigns on
  create; surfaced in the breadcrumb and reference cards.
- **Stable node identity.** Node ids are currently `node-${Date.now()}` and get **regenerated** when the agent
  rewrites a diagram (`apply/route.ts` overwrites `canvas_data.nodes` wholesale), which **breaks relation/rollup
  links and any step-level reference**. Fix: (a) the agent's `propose_update_canvas` must **preserve existing
  node ids** (pass ids through `get_canvas` → edit → return same ids); enforce in `lib/agent/tools.ts`
  `normalizeDiagram` and in the prompt; (b) optionally add a stable per-step `code` in `node.data` (e.g.
  `HR-01.04`) so references key on the code, not the volatile id.
- **Reference model.** Add a lightweight `Reference` concept: `{ from (canvas/node/doc), to (canvas/node/doc),
  type }` where type ∈ {process-step, template, policy, standard, checklist, authority, person, role,
  depends-on}. Back it with a table or derive from typed `@`-mentions (Phase 3). This powers **backlinks**
  ("what references `TMPL01-HR-01`?") and integrity checks (flag dangling refs after an edit) — the latter is
  also the seed of the drift-detection moat.
- **ID/reference resolver util** (`lib/refs/…`): resolve a code → entity, list backlinks, validate references.
  Reuse the relation/rollup machinery in `useCanvas.ts` (`updateRelationInCanvas`, `refreshColumnsData`) as the
  storage substrate where it fits.

**STATUS: ✅ done + in-browser agent QA passed (2026-06-15).** `tsc --noEmit` + `next build` both clean;
resolver + uniqueness verified against the live DB; node-id reconciliation unit-tested.

**End-to-end agent run (verification step 3) — PASSED.** Set code `HR-01` on "Recruitment & Sourcing" (15
nodes) → breadcrumb chip showed `HR-01`. Asked the in-app agent to "add a 'Schedule Intake Call' step after the
start" → it called `get_canvas` then `propose_update_canvas`; Apply persisted via autosave (version 1→2). DB
check: **15/15 original node ids preserved, 0 lost**, one new node `intake_call` added, edges rewired
`start→intake_call→define_profile` (existing ids intact). Then seeded one `depends-on` reference and asked
"which playbook is HR-01 and what references it?" → the agent used `resolve_code` + `list_backlinks` and
answered correctly ("Recruitment & Sourcing", referenced by "Job Requisition & Approval"), with a blast-radius
note. (QA leftovers: HR-01 code intentionally kept on that playbook + the agent-added `intake_call` step; the
seeded reference was deleted.)

**Migration & DB note:** no `Workspace` model exists, so "unique per workspace" = **unique per `user_id`**. The
Prisma CLI/client are version-mismatched (CLI 6 vs client 5) and the **runtime never uses the Prisma client**
(Supabase JS only), so DB changes were applied as **idempotent raw SQL via `prisma db execute`**
(`prisma/migrations/20260615202841_phase2_canvas_code_and_reference/migration.sql`) — NOT `migrate dev`, which
could detect drift and offer a destructive reset on a DB with data. `schema.prisma` was updated to match (and
`prisma validate` passes). Re-running the migration is safe (all `IF NOT EXISTS`).

**2a — stable node identity (✅):** new pure helper `lib/agent/node-ids.ts` `reconcileNodeIds()` re-anchors a
proposed diagram onto the canvas's existing node ids — exact id match first, then label match to recover ids the
model regenerated — and rewrites edges + nodeStyles for any remap. Wired into `tools.ts` `propose_update_canvas`
(fetches existing `canvas_data.nodes`, reconciles, reports counts in the tool_result). Prompt gained an
"EDITING AN EXISTING PLAYBOOK (stable ids)" rule telling the model to copy ids verbatim. Behavioral test passed
(preserve / label-recover / mint, with edge + style remap). The volatile-id source (`node-${Date.now()}` in the
UI + fallback generators) is unchanged — preservation is enforced at the agent-edit boundary where it matters.
Deferred: optional per-step `code` in `node.data` (not needed yet; references currently key on the stable id).

**2b — `code` on Canvas (✅):** `canvas.code TEXT` + unique index `(user_id, code)` (Postgres NULL-distinctness
allows many code-less canvases; non-null codes unique per user — verified a duplicate is rejected with `23505`).
Generator `lib/refs/codes.ts` (`generateCanvasCode` / `derivePrefix` / `normalizePrefix`): honors an explicit
well-formed agent code if free, else `PREFIX-NN` auto-incrementing past existing codes. The agent **assigns on
create** — optional `code` on `propose_create_canvas` → threaded through the proposal → `apply/route.ts`, which
is the authority: it generates server-side and **retries on `23505`** (never blocks creation on a collision).
Surfaced as a monospace **code chip** in the shared breadcrumb header for canvas/table **and** document (both
stores now load `code`).

**2c — reference model + resolver (✅):** `reference` table `{ from_canvas(+from_node), to_canvas(+to_node),
to_code, type, user_id }` with FK cascade from/to canvas. Resolver `lib/refs/resolver.ts`: `resolveCode`,
`createReference` (resolves `toCode`→canvas), `listBacklinks` (by id and/or code, embeds the source canvas via
the `reference_from_canvas_fkey` hint), `listOutgoingReferences`, and `findDanglingReferences` (the drift-moat
seed — flags refs whose `to_code` no longer resolves). Two read tools added for the agent — `resolve_code` and
`list_backlinks` (blast-radius before edits) — plus prompt notes on codes. DB smoke test passed end-to-end:
assign code → resolve → create real + dangling refs → backlinks (with embedded source) → dangling detection →
cleanup. Reference *creation* from typed `@`-mentions is Phase 3; agent-authored refs are Phase 4.

---

## Phase 3 — The composite document container

Goal: a Document that holds live flows + live tables + sub-document **reference cards**, all staying in sync.

- **Reliable embed refresh.** Today embeds refresh on mount / manual button only (`ReactFlowNodeView.tsx`,
  `CanvasTableNodeView.tsx`). Add: (a) **Supabase realtime** subscription on the referenced `canvas_data`
  row so embeds update when the source changes; (b) an **explicit refresh after an agent apply** (call the
  node's `updateAttributes()` / the table's `refreshSingleCanvas()` once the source canvas/table is saved);
  (c) keep manual refresh as fallback. Avoid naive polling.
- **Document-in-document reference card** — new Tiptap node extension (e.g. `DocReference`) under
  `components/editor/extensions/`, modeled on `FileMention` + `CanvasTableNode`. Stores `docId` + `refType`
  (template/policy/standard/…); renders a live **card**: title, **ID/code**, owner, last-edited, status,
  click-through — exactly the March "Template/Policy" metadata slides. This is the chosen sub-doc representation.
- **Typed `@`-mentions.** Extend `FileMention` so `@` can resolve not just files but **steps** (`HR-01.04`),
  **templates/policies/standards** (by code), and **people/roles** (Phase 5 directory). Each becomes a typed
  reference (Phase 2) and a navigable chip. Add a placeholder hint ("Type / for blocks, @ to link").
- **Slash menu additions** for the new blocks: "Embed Document (reference card)", "Embed Flow", "Embed Table",
  keep them in the Embeds group; finish Playbook naming.

**STATUS: ✅ done + in-browser QA passed (2026-06-16).** `tsc --noEmit` + `next build` both clean (new routes
`/api/canvas/meta/[id]` and `/api/refs` registered). Verified live against the composite-document scenario:
embedded a Policy reference card + a typed `@HR-01` mention + a live HR-01 flow into one document; a DB edit to
the source flow refreshed the open embed with **no manual refresh**; reload persisted all three; 0 console errors.

**3a — reliable embed refresh (✅):** new shared module `lib/realtime/embed-refresh.ts` — an in-app event bus
(`emitEmbedRefresh` / `subscribeEmbedRefresh`) + a best-effort Supabase realtime channel on the source
`canvas_data` row. Three complementary, **debounced (single refetch), non-polling** signals drive each embed:
(a) realtime (cross-tab/client), (b) the in-app bus — fired from `useCanvas.saveCanvas()` after a successful
write and from `AgentChat.applyProposal()` after an apply (so an agent edit to an embedded canvas refreshes the
open doc), and (c) a tab-focus/visibility refresh (catches edits made elsewhere while the doc stayed open).
Wired into `ReactFlowNodeView` (→ `fetchCanvasData`), `CanvasTableNodeView` (→ `loadTableData(true)`) and the new
`DocReferenceNodeView` (→ re-fetch card meta). Manual refresh kept as fallback. Realtime enabled on `canvas_data`
via idempotent migration `prisma/migrations/20260616_phase3_realtime_canvas_data/migration.sql` (adds the table to
`supabase_realtime` + `REPLICA IDENTITY FULL`) — applied via `prisma db execute`; the bus + focus path are the
guarantee if a deploy's realtime is off. **QA:** a focus event fired exactly **1** debounced
`/api/canvas/data/<id>` refetch; a DB `UPDATE canvas_data` on the source fired exactly **1** realtime refetch in
the open embed. ✅

**3b — sub-document reference card (✅):** new Tiptap atom node `DocReference` (`extensions/DocReference.ts` +
`DocReferenceNodeView.tsx`) storing `docId` + `refType` (template/policy/standard/checklist/authority/document) +
cached `label`/`code` (so it renders instantly + in print/export). The card fetches live metadata from the new
**`/api/canvas/meta/[id]`** route (owner-scoped; title, code, type, owner, last-edited — owner is a separate
best-effort query so a join-name mismatch can't break the card) and renders title, type badge, **code chip**,
owner, "Updated …", a refresh button + click-through. Inserted via a new `DocReferenceDialog` (picks a
document — docs sorted first — + a refType chip) reachable from the slash menu **and** the toolbar's Insert Views
menu. CSS in `editor.css`. **QA:** card rendered `Policy / PLCY-01 / HR Policies / claude.qa@example.com /
Updated 6h ago`, survived reload, and click-through navigated to the referenced doc. ✅

**3c — typed `@`-mentions + reference creation (✅):** `useFileSearch` now selects + matches on `code`, so
`@HR-01` resolves the coded playbook; `MentionList` shows a code chip; `FileMention` carries a `code` attr and a
custom suggestion `command` that, after inserting the chip, fires `onMention` → records a typed cross-reference.
Reference creation goes through the new **`POST /api/refs`** (server-authoritative: user_id from session, must own
the source, resolves `toCode`→canvas, **dedupes**, rejects self-refs); `GET /api/refs?canvasId|code` returns
backlinks. Client helper `lib/refs/client.ts` (best-effort, never blocks the insert). `@`-mentions create a
`depends-on` ref; reference cards create a typed ref (policy/template/…). Placeholder hint changed to
"Type / for blocks, @ to link…". **QA:** `@HR-01` → chip `@Recruitment & Sourcing` (data-code HR-01) + a
`depends-on` backlink; the card created a `policy` backlink; a duplicate POST returned `deduped:true` (still 1
row). **Deferred (Phase 5):** step-level (`HR-01.04`) and person/role mentions need node-level codes + the
directory; mention-removal GC is left to the dangling-ref detector for now. ✅

**3d — slash/toolbar menu + naming (✅):** Embeds group is now "Embed Flow" / "Embed Table" / "Embed Document"
(+ "Mention / link"), all in the Embeds group; toolbar Insert Views gained "Insert Document reference". **QA:**
`/embed` filtered to exactly the three new items; the toolbar menu showed the new entry. ✅

**QA leftovers (intentional):** `Untitled Document 1` keeps the embedded Policy card + `@HR-01` mention + HR-01
flow as a live composite-doc sample; `HR Policies` keeps code `PLCY-01`; the `policy` + `depends-on` references
remain (they back the card + mention).

---

## Phase 4 — The agent authors & edits documents (headline)

Goal: the agent can build and maintain a March-style composite document end-to-end, with approve-before-write.

- **New agent tools** (`lib/agent/tools.ts`): `get_document(canvas_id)`, `propose_create_document(name, code?,
  body)`, `propose_update_document(canvas_id, body)`, where `body` is a structured block list the apply layer
  converts to Tiptap JSON — blocks include headings/paragraphs/lists/tables **and** `embed_flow(canvasId)`,
  `embed_table(tableId, projection)`, `doc_reference(docId, refType)`, `mention(code|id, type)`. Keep the
  existing canvas tools. Everything still flows through the **proposal → preview → Apply** gate.
- **Apply path** (`app/api/ai/agent/apply/route.ts`): add `kind: "create_document" | "update_document"` that
  writes `document_data.lexical_state` (build the Tiptap JSON from the block list; reuse the save shape in
  `useDocument.ts`) and writes a history snapshot. Today this file only writes `canvas_data` — extend it.
- **Document-aware client apply** (`components/agent/AgentChat.tsx`): when a document proposal targets the
  open document, apply into the document store and re-render instantly (mirror the existing instant
  `useCanvasStore.initializeWithAIData` path); otherwise commit via API and navigate.
- **Workspace index + prompt** (`lib/agent/workspace.ts`, `lib/agent/prompt.ts`): include **documents** (not
  just canvases) with their codes; teach the agent the Operating-Model conventions — ID scheme, when to embed a
  flow vs a table vs a reference card, preserve node ids on edit, never claim a write before Apply.
- **"Scaffold a process page" capability.** A high-value agent flow: given "document our hiring process," the
  agent creates the flow canvas, the Activities/RACI/Deliverables tables, the Template/Policy reference stubs,
  assigns codes, and assembles them into one composite Document — i.e., generate a full HR-01-style unit in one
  approved batch. This is the demo that proves the vision.

**STATUS: ✅ done + in-browser agent QA passed (2026-06-16).** `tsc --noEmit` + `next build` both clean; a
parallel adversarial review (find → verify) ran over the diff and its 6 confirmed bugs were fixed (see below);
the block→Tiptap converter has a 15-assertion runtime test. **Headline demo verified live with the real agent:**
asked the in-app agent to "create a Recruitment Quick Reference document with the Recruitment & Sourcing flow
embedded and a policy card to HR Policies" → it read the workspace (found codes `HR-01`/`PLCY-01`), called
`propose_create_document`, said "I've prepared a preview — apply it" (never claimed a write), the **document
preview** card rendered a block summary, Apply navigated to the doc and it rendered the **intro + Process heading
+ live HR-01 flow embed (fully hydrated) + Policies heading + PLCY-01 reference card** — 0 console errors. A
follow-up `update_document` added a Notes section: embeds + card survived, a `canvas_history` snapshot was
written (v3, carrying the document body), and references reconciled to exactly `{depends-on, policy}`.

**Design (block-DSL, not raw Tiptap):** the agent authors a document as a structured **block list**; the new pure,
isomorphic `lib/agent/document-blocks.ts` is the single converter used by BOTH the server apply route and the
client instant-apply — `blocksToTiptapDoc` (→ a ProseMirror doc), `tiptapToBlocks` (← for `get_document`), and
`extractReferences` (the cross-reference rows). Block types: heading/paragraph/bullet_list/numbered_list/
task_list/divider/static-table + the live `embed_flow` / `embed_table` / `doc_reference` / inline `mention`.

**4a — tools (✅):** `lib/agent/tools.ts` gained `get_document`, `propose_create_document`,
`propose_update_document`; `ToolProposal` widened with `target:"canvas"|"document"` + `body` (`diagram` made
optional). The proposal still rides the existing SSE `proposal` event + proposal→preview→Apply gate (no loop
changes). `assertOwnership` now also selects `code`.

**4b — apply path (✅):** `app/api/ai/agent/apply/route.ts` gained `target:"document"` branches. Create inserts a
`canvas` row with `canvas_type:"document"` (+ code gen / 23505 retry) and a `document_data` row whose
`lexical_state` is the editor's exact `JSON.stringify({state,json,controls,page})` wrapper (so it loads with zero
editor changes). Update preserves the existing `controls`/`page`, bumps `version`, writes a `canvas_history`
snapshot (the `data` JSONB holds the document wrapper), and **reconciles references** (deletes the doc's
`from_node`-null refs, recreates from `extractReferences` — so backlinks track the current content).

**4c — client (✅):** `AgentChat.tsx` branches document proposals (a document **preview** card + a document apply
path); for an update to the OPEN doc it pushes content in instantly via a new `useDocument.applyDocumentContent`
→ `aiApplySeq` signal → a non-gated re-apply effect in `editor/index.tsx` (guarded by `isApplyingRemoteRef` so it
doesn't loop through autosave, and by `aiAppliedCanvasId === canvasId` so one doc's content can't replay onto
another). Create navigates to `/protected/document-editor/[id]` via the new `lib/playbook-href.ts` (documents and
flow/table canvases live on different routes — this also fixes the Phase 3 card/mention click-through for
document targets).

**4d — workspace + prompt (✅):** `buildWorkspaceIndex` now surfaces each artifact's `code` (`- [id] {CODE} "name"
(type)`); documents were already listed. `prompt.ts` gained the document tools, a DOCUMENTS block-authoring
section (when to use a static table vs `embed_flow` vs `embed_table` vs a `doc_reference` card), the process-page
scaffold **dependency-order** sequence (create the flow first → it needs an id before you can embed it; write
tabular data as static `table` blocks, never via `propose_create_canvas` which makes a flow not a table), and an
EDITING-AN-EXISTING-DOCUMENT (preserve embed/reference ids) rule.

**Adversarial-review fixes (6, all verified):** (1) empty `bullet/numbered/task_list` emitted a schema-invalid
node → drop empty lists; (2) a string/flat `table` `headers`/`rows` threw and 500'd the whole apply → `Array.isArray`
guards + scalar-row tolerance; (3) `embed_table` round-trip dropped `selectedColumns` (re-applied table rendered
empty) → `tiptapToBlocks` now recovers `columns`/`displayRows`; (4) a column-less `embed_table` shows a permanent
empty state (it doesn't self-hydrate columns like the flow embed does) → require `columns`, degrade to a note,
and mark it required in the prompt/tool; (5) a non-UUID id the model put in an id field poisoned the `to_canvas`
FK and silently dropped a resolvable backlink → a UUID gate routes code-like values through `to_code`; (6) the
process-page scaffold told the agent to make tables with `propose_create_canvas` (a hybrid, not a table — the
embed would be empty) → prompt now uses static `table` blocks / existing table artifacts only. Plus a defensive
cross-document instant-apply guard (`aiAppliedCanvasId`).

**Known gaps (documented, not blocking):** no document-side node-id reconcile (the prompt carries the "preserve
embed/reference ids" burden); inline @-mentions *inside* a paragraph are flattened to text on the
`get_document` → edit round-trip (standalone mention/card blocks round-trip fine); the "one approved batch"
scaffold is realized as a guided sequence (a flow must be applied to get an id before a document can embed it).

**QA leftover (intentional):** the agent-authored **`Recruitment Quick Reference`** (code `RQ-01`) is kept as a
live composite-document sample (intro + embedded HR-01 flow + Notes + PLCY-01 policy card).

---

## Phase 5 — Operating-Model authoring UX

Goal: make building a real operating model fast and faithful, not a blank page.

- **Process-page template/scaffold** matching the March layout (title + ID, embedded flow, Activities table,
  RACI table, Deliverables table, Templates/Policies/Standards reference cards). Available from "Create New"
  and as the agent's default structure.
- **Employee/Org directory as a first-class entity** so `@person` / `@role` resolve to real people (the
  approval-mapping need), backed by a directory table; RACI cells and policy approvers become typed references.
- **Backlinks panel** ("what references this") on every artifact, powered by Phase 2.
- **Cmd+K search + saved views** (deferred from the launch plan): the flat ~150-item relation/embed picker
  proves the need; one searchable, folder-grouped picker for relations, embeds, and @-mentions.

**STATUS: 5a (backlinks panel), 5b (process-page scaffold), 5c (Cmd+K + searchable relation picker) ✅ done +
in-browser QA passed (2026-06-16); `tsc --noEmit` + `next build` clean; an 11-finding adversarial review
(find→verify) was run over the 5a+5b diff and every confirmed finding was fixed (see 5a/5b notes).** 5d
(Employee/Org directory) is the remaining sub-feature.

**5a — Backlinks panel (✅):** new `components/refs/BacklinksPanel.tsx` — a
header `Popover` (mounted once in the shared `components/canvas-new/header.tsx`, so it appears on all three
surfaces) showing both **incoming** ("Referenced by") and **outgoing** ("References") links, grouped by
direction, with type badges + code chips, click-through via `lib/playbook-href.ts`. Backed by the Phase-2
`GET /api/refs?canvasId|code` which now **also returns `outgoing`** (via `listOutgoingReferences`). The panel
fetches the count on mount and refreshes on open; it subscribes to the embed-refresh bus **only while open**
(no fetch storm during canvas autosave). Owner-gated (the reference graph is `user_id`-scoped, so a non-owner
viewer would only ever see an empty panel; viewer-visible backlinks would need owner-scoped reads — deferred).
**QA:** on `HR-01` the panel showed *Referenced by → Recruitment Quick Reference (RQ-01) + Untitled Document 1*
(both Depends-On); on the `RQ-01` document it showed *References → HR-01 (Depends-On) + PLCY-01 (Policy)*;
click-through routed a document backlink to `/protected/document-editor/[id]`. 0 console errors. ✅

**5b — Process-page scaffold (✅):** new pure, isomorphic `lib/agent/process-page-template.ts`
`buildProcessPageBlocks()` — the single source of truth for the March layout (H1 title, intro, **Process Flow**
[`embed_flow` if a flow id is supplied, else a guided placeholder], **Activities** [Ref/Activity/Owner/Notes],
**RACI** [Activity/R/A/C/I], **Deliverables** [Deliverable/Format/Owner], **Templates/Policies/Standards**
[`doc_reference` cards, or a typed `mention` chip when only a code is known, or a placeholder]). It emits only
existing `DocBlock` types, so it flows through the same `blocksToTiptapDoc`/`extractReferences` as Phase 4.
Wired to BOTH: (a) a new agent tool **`propose_process_page`** (`lib/agent/tools.ts`) that resolves any
reference-card codes → docIds server-side then rides the existing proposal→preview→Apply path unchanged
(prompt.ts now steers "document a process" to it); and (b) a **"Process Page" tile** in
`components/dashboard-sidebar/create-new-modal.tsx` that POSTs to `/api/ai/agent/apply` (kind:create,
target:document — DOCUMENT only, so no diagram-limit gate) and navigates into the new doc. A 32-assertion
runtime check verified the factory (blank/live/code-only/messy shapes). **QA:** the tile created a document,
the apply route assigned code `PP-01`, the scaffold rendered (6 headings + 3 tables + placeholders), and it
survived a reload. 0 console errors. ✅

**5c — Cmd+K + searchable pickers (✅):** (a) a global **command palette** (`components/command-palette/
CommandPalette.tsx`, built on the already-present `components/ui/command.tsx` / `cmdk`) mounted once in
`app/protected/layout.tsx` — Cmd/Ctrl+K opens a searchable, **folder-grouped** list of every playbook/table/
document (cross-folder, reusing the `useFileSearch` cache via a new `getAllFiles()`), matching on name **and**
code, navigating via `playbookHref`. (b) The flagged flat ~150-item **relation value picker**
(`components/canvas-new/add-table-cell-relation-trigger.tsx`) rebuilt from a search-less `DropdownMenu` into a
`Popover` + `cmdk` `Command` (search + keyboard nav), preserving the exact contract (multi-select add/remove,
the `{id,label}` shape on select, the per-field visibility settings). **QA:** Cmd+K opened folder-grouped with
code chips, `HR-01` filtered to the coded playbook, Enter navigated to it; the relation picker searched
(`Mark` → only "Mark Davis"), selected, linked, and **persisted across reload**. 0 console errors. The embed
dialogs (`TableSelectorDialog`/`CanvasDialog`) and the @-mention popup keep their own working UIs — full
unification of those into the one shell is deferred (behavior-scope change). ✅

**5d — Employee/Org directory:** NOT YET STARTED (the largest/riskiest sub-feature — needs a directory entity,
a node-level reference resolver, an `@person`/`@role` mention source, RACI-cell typed references in the
table-view, and agent awareness). Tracked separately.

**Review fixes folded into 5b/5c (all 11 confirmed findings):** BacklinksPanel now (1) sends `&code=` so
code-only backlinks resolve, (2) guards setState-after-unmount via a `mountedRef`, (3) only subscribes to the
refresh bus while open (kills the ~2s autosave fetch storm), (4) is owner-gated in the header; (5) the
"Process Page" tile resets its in-flight flag on modal close; (6) the dead `opts.code` was removed from the
scaffold factory.

---

## Critical files

- `prisma/schema.prisma` — add `code` to Canvas; reference model.
- `lib/canvas/column-data.ts`, `components/canvas-new/table-view/index.tsx`, `components/canvas-new/index.tsx` — table-view bug.
- `lib/supabase/client.ts` — GoTrueClient / service-role-key security.
- `lib/subscription-features.ts` — `.maybeSingle()`, logger gate.
- `components/onboarding/custom-tooltip.tsx`, `lib/store/useOnboarding.ts` — tutorial auto-start + logs.
- `components/editor/index.tsx` + `extensions/ReactFlowNode(View).tsx`, `CanvasTableNode(View).ts(x)`,
  `FileMention.ts`, `SlashCommands.ts`, `slash-items.tsx` — embeds, refresh, new `DocReference` node, typed @.
- `components/editor/hooks/useDocument.ts` — document save/load shape (reuse for agent apply + autosave).
- `lib/agent/tools.ts`, `lib/agent/prompt.ts`, `lib/agent/workspace.ts`, `app/api/ai/agent/apply/route.ts`,
  `components/agent/AgentChat.tsx` — agent document-authoring.
- `lib/store/useCanvas.ts` — `updateRelationInCanvas`/`refreshColumnsData` (reference substrate), autosave.

## Verification (end-to-end, against the March structure)

Run on `pnpm dev` (use the local `next` binary; QA login is in memory; the QA account now has unlimited limits).

1. **Phase 0**: create a Table, add a column to it while empty, add rows — columns persist, headers render, no
   reload needed, no `beforeunload`. Console is quiet: no 406s, no GoTrueClient warning, ≤ a couple of benign
   warnings, no nodeTypes spam on a doc with an embed. Confirm the service-role key is NOT in the client bundle.
2. **Phase 1**: edit a doc/table, navigate away without clicking Save — work persists; indicator shows "saved".
3. **Phase 2**: give a canvas a code (`HR-01`); have the agent edit its diagram — node ids and relation/rollup
   links survive; backlinks resolve.
4. **Phase 3**: in a document, embed a flow + a table + a Policy reference card; edit the source flow → the
   embed updates without manual refresh; the card shows the policy's code/owner and click-through works.
5. **Phase 4 (headline)**: tell the agent "document our recruitment process like an operating model." It
   proposes a composite Document (flow + Activities/RACI/Deliverables tables + Template/Policy reference cards,
   all coded and cross-linked); Apply renders it; re-open → it persisted; ask it to "add a background-check
   step" → the flow updates and the embed in the doc reflects it.
6. **Regression**: existing canvas create/edit (instant apply), `/try`, onboarding seed, Stripe quota gate.

No automated tests exist for these areas; verification is manual via the dev server + the in-app agent.

## Known-bug appendix (file:line checklist)

Phase 0 items below are ✅ DONE (2026-06-15); corrected root causes noted inline. Phase 4 items remain open.

- ✅ `.single()` → `.maybeSingle()` (406s): fixed `lib/subscription-features.ts:87` + pricing/profile/status/debug
  subscription queries, `lib/hooks/useSubscriptionLimits.ts` (ai_usage + subscription), promo lookups. **Plus
  (found in QA):** `lib/store/useCanvas.ts` canvas_data + canvas_settings loads and the related-canvas
  `canvas_data` loads in `components/canvas-new/table-view/index.tsx` — these threw real console-error 406s on
  every fresh table/canvas open.
- ✅ Table empty-column bug: real cause was `lib/store/useCanvas.ts` `saveCanvas()` early-returning on
  0 nodes/edges (dropping column-only changes), NOT `column-data.ts`/`addColumn` (which already persists the def)
  nor the `SortableContext` header (a symptom). Guard relaxed to also require `columns.length === 0`. QA-verified
  the column survives reload on a row-less table.
- ✅ `lib/supabase/client.ts` — `supabaseAdmin` moved to server-only `lib/supabase/admin.ts`; admin ops via
  `app/api/admin/users/*` behind `lib/auth/require-admin.ts`; env var de-`NEXT_PUBLIC_`'d. Key verified absent
  from client bundle. (⚠️ rename the prod/Vercel env var too.)
- ✅ ReactFlow nodeTypes/edgeTypes — all live mounts already use the hoisted `flow-config` constants + `onError`;
  the `002` warning is a **dev-only** React StrictMode artifact (absent from prod build). Two dead-code mounts
  (`CanvasRenderer.tsx`, `StandaloneFlowChart.tsx`) hardened for completeness.
- ✅ `components/onboarding/custom-tooltip.tsx` — removed the auto-start `useEffect` (tutorials opt-in; covers
  existing profiles with persisted `autoStartTutorials: true`), and replaced the 5s multi-element poll in
  `waitForTutorialElements` with a single first-target wait. `autoStartTutorials` default also flipped to `false`.
- ✅ Logger gate `lib/log.ts` (gated on `NEXT_PUBLIC_DEBUG_LOGS`); ~78 `console.log/warn` routed through it.
- ✅ Playbook rename: `slash-items.tsx` ("Playbook"), `EditorToolbar.tsx` ("Insert Playbook"),
  `TableSelectorDialog.tsx` ("Insert Table"); **plus (found in QA)** "New Canvas" → "New Playbook" in
  `dashboard/folder-content.tsx` and `dashboard-sidebar/user-sidebar.tsx` create menus. QA-verified live.
- ✅ `app/api/ai/agent/apply/route.ts` — `target:"document"` create/update branches write `document_data`
  (the `{state,json,controls,page}` wrapper) + a `canvas_history` snapshot + reconcile references (Phase 4).
- ✅ `lib/agent/tools.ts` — added `get_document` / `propose_create_document` / `propose_update_document`
  (block-DSL body via `lib/agent/document-blocks.ts`); `ToolProposal` widened with `target`/`body` (Phase 4).
