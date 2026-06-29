-- Composite indexes backing the relation counts in GET /api/canvas/meta/[id]?include_relations
-- and backlink/outgoing lookups (listBacklinks / listOutgoingReferences). The single-column
-- indexes on from_canvas / to_canvas already exist; these add the (canvas, type) composites so
-- "who references X, of type T" is index-served. Idempotent + additive.

create index if not exists reference_from_canvas_type_idx
  on public.reference (from_canvas, type);

create index if not exists reference_to_canvas_type_idx
  on public.reference (to_canvas, type);
