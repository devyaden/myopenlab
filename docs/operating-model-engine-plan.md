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

- **Table-view empty-column bug (root-caused).** `lib/canvas/column-data.ts` `addColumn()` seeds the new
  column onto existing nodes via `nodes.map(...)`, which is a **no-op when `nodes` is empty**, so a column
  added to a row-less table isn't persisted and the header render collapses until save+reload. Fix:
  (a) persist column definitions independent of node seeding (they already live in `ColumnDefinition`);
  (b) when `addNode` runs (`components/canvas-new/index.tsx` ~L738-778) seed from the **current** column
  list reliably; (c) repair the header/`SortableContext` mismatch in
  `components/canvas-new/table-view/index.tsx` (~L2592-2596) when `sortedHierarchy` is empty.
  Also fix the new-column-label-renders-blank case and the flaky cell-edit-open (single vs row click).
- **`.single()` → `.maybeSingle()`** in `lib/subscription-features.ts:87` (user_subscription) — source of
  the repeated **406s**. Audit other 0-or-1 `.single()` calls (canvas_settings path already handles PGRST116).
- **Supabase client / security** — `lib/supabase/client.ts` defines BOTH the browser `supabase` client and
  a `supabaseAdmin = createClient(..., SERVICE_ROLE_KEY)` in the **same module that is imported client-side**.
  This is the likely "Multiple GoTrueClient instances" warning (×13 live) AND a **possible service-role-key
  exposure to the browser** — VERIFY whether that key is bundled client-side (check the env var name; if it
  reaches the browser it's a critical leak). Move `supabaseAdmin` to a server-only module; keep one browser client.
- **ReactFlow "new nodeTypes/edgeTypes object" warning (×68 live).** Static analysis says canvas mounts use
  the hoisted `components/canvas-new/flow-config.ts`, yet the warning fires live — so the offending mounts are
  elsewhere: most likely the **document embed** (`extensions/ReactFlowNodeView.tsx`) and the table preview /
  `CanvasTableNodeView`. Grep every `ReactFlow` mount; ensure `nodeTypes`/`edgeTypes` come from the hoisted
  constant. (Perf: this re-inits ReactFlow on every keystroke in a doc with embeds.)
- **Logger gate.** ~107 `console.log`s in lib/components (worst: `lib/subscription-features.ts` cache logs,
  `lib/store/useOnboarding.ts` ×8, `lib/store/useCanvas.ts`). Add a `lib/log.ts` gated on an env flag; replace.
- **Tutorial auto-start.** `components/onboarding/custom-tooltip.tsx` (~L460-494, L568-596) auto-starts the
  next tutorial and polls 5s for elements that don't exist on the page → "elements not ready after 5000ms".
  Make tutorials opt-in; never poll for unmounted targets.
- **Finish the Playbook rename.** Editor "Insert Views → Insert Canvas" and slash "Canvas" still say *Canvas*
  (`components/editor/slash-items.tsx`, the Insert menu). One vocabulary everywhere.

---

## Phase 1 — Unify persistence to autosave

Goal: kill the two-models surprise (canvas auto-syncs; tables/docs need manual Save + throw `beforeunload`).

- Make table view and document view **autosave** on a debounce, mirroring `useCanvas.syncChanges()`.
- Add a single, quiet **save-state indicator** ("Saving… / All changes saved") in the editor header used by
  all three views. Keep the manual Save button as an explicit version snapshot, not the contract.
- Reuse the existing transactional save (`database-functions/save-canvas-transaction.sql`) and the
  `document_data` upsert in `components/editor/hooks/useDocument.ts`.

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

- `lib/subscription-features.ts:87` — `.single()` → `.maybeSingle()` (406s).
- `lib/canvas/column-data.ts` `addColumn()` — no-op seeding on empty `nodes`; `components/canvas-new/index.tsx`
  ~L738-778 `addNode` column seeding; `components/canvas-new/table-view/index.tsx` ~L2592-2596 header vs
  `SortableContext` mismatch.
- `lib/supabase/client.ts` — `supabaseAdmin` (service-role) in a client-imported module: GoTrueClient ×13 +
  possible key exposure. Move server-only.
- ReactFlow nodeTypes/edgeTypes ×68 — audit `extensions/ReactFlowNodeView.tsx`, `CanvasTableNodeView.tsx`, and
  any non-`flow-config` mount.
- `components/onboarding/custom-tooltip.tsx:~460-494,568-596` — tutorial 5s element-poll / auto-start.
- `app/api/ai/agent/apply/route.ts` — writes `canvas_data` only; no `document_data` path (Phase 4).
- `lib/agent/tools.ts` — canvas-only tools; no document/embed tools (Phase 4).
- `components/editor/slash-items.tsx` + Insert menu — "Canvas" labels not yet "Playbook".
