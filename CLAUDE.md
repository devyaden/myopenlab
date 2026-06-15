# theopenlab

A "living playbooks" tool for SMEs: a document/diagram workspace where processes are captured as
auto-updating diagrams and rich documents, with an in-app AI agent that can author and edit them.
Stack: Next.js 16 (App Router, Turbopack) · React 19 · Tiptap editor · ReactFlow · Supabase (auth + DB)
· Prisma (schema only; runtime uses the Supabase JS client) · Zustand · Stripe · PostHog.

## Active plan

The current product direction is the **Operating Model Engine** — making March-style composite documents
(live embedded flows + tables + sub-document reference cards, cross-referenced by agent-assigned IDs)
dynamic and editable by the in-app AI agent.

➡️ **Read [`docs/operating-model-engine-plan.md`](docs/operating-model-engine-plan.md) before starting work.**
It is phased (Phase 0 hygiene/correctness/security → … → Phase 4 agent document-authoring) and ends with a
file:line known-bug appendix. Start at Phase 0 unless told otherwise.

## Dev notes

- Run the dev server with the local binary (pnpm is not globally installed; `corepack pnpm` also works):
  `./node_modules/.bin/next dev`
- User-facing vocabulary is **"Playbook"** (internal Prisma model is still `Canvas` — do not rename the model).
- The three editor surfaces (Canvas / Table / Document) are all `canvas` rows distinguished by `canvas_type`.
