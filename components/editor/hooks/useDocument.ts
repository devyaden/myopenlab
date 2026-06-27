"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { debounce } from "lodash";
import { Folder } from "@/types/sidebar";
import { retryWithBackoff, isTransientError } from "@/lib/net/retry";
import { backupConflictLoser } from "@/lib/document-backup";

/**
 * Detects an expired/invalid Supabase auth token. PostgREST returns
 * PGRST303 for an expired JWT; the message also contains "JWT".
 */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "PGRST303") return true;
  return typeof e.message === "string" && /jwt|token|expired/i.test(e.message);
}

interface DocumentState {
  id: string;
  name: string;
  user_id: string;
  code: string | null;
  /** Canvas visibility ("private" | "public"), loaded with the document so the
   *  editor's authorization check doesn't need a second round-trip. */
  visibility: string;
  description: string;
  editor_state: any;
  version: number;
  canvas_id: string;
  /** The canvasId whose content has actually finished loading into the store —
   *  set ONLY in the same `set()` that populates `editor_state`. The editor's
   *  one-shot content loader gates on this (not `isLoading`) so it can never
   *  claim its gate against a stale `isLoading: false` left over from a
   *  previously-loaded doc in this singleton store (the "blank until refresh"
   *  bug on soft navigation). Not persisted — must reset to null on reload. */
  loadedCanvasId: string | null;
  isLoading: boolean;
  /** Loading state for the secondary folder-canvases fetch (insert-picker list
   *  + table-embed data). Kept SEPARATE from `isLoading` so it never blocks the
   *  editor's one-shot content loader — the document paints as soon as its own
   *  data arrives, and folder data streams in behind it. */
  folderLoading: boolean;
  saveLoading: boolean;
  error: string | null;
  /** Set when a save is rejected because the document changed elsewhere since we
   *  loaded it (optimistic-version mismatch). Stops the silent last-write-wins
   *  overwrite; Part 4 turns this into a resolution chooser. */
  conflict: { serverVersion: number; serverState: any } | null;
  /** True when the LAST document load failed (distinct from save errors, which
   *  also use `error`). Drives the load-error recovery banner. */
  loadFailed: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  folderCanvases: any[];
  folder?: any;
  // Phase 4: a monotonically-increasing signal + payload so the open editor can
  // re-render content pushed in by an agent apply (the editor's one-shot loader
  // ignores later editor_state changes by design — this is the explicit escape).
  aiApplySeq: number;
  aiAppliedDoc: any;
  /** Which document the pending aiAppliedDoc belongs to — so the editor never
   *  replays one document's agent content onto another on (re)mount. */
  aiAppliedCanvasId: string | null;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  updateEditorState: (editorState: any) => void;
  applyDocumentContent: (json: any, version?: number) => void;
  loadDocument: (canvasId: string) => Promise<void>;
  reloadDocument: () => Promise<void>;
  saveDocument: () => Promise<void>;
  /** Conflict resolution (Part 4) — all preserve the losing side first. */
  resolveConflictKeepMine: () => Promise<void>;
  resolveConflictTakeTheirs: () => void;
  dismissConflict: () => void;
  /** Reconcile a newer remote version observed via realtime: raise a conflict
   *  if there are local unsaved edits, otherwise silently adopt it. */
  applyRemoteChange: (newVersion: number, newState: any) => void;
  syncChanges: () => void;
  resetState: () => void;
  loadFolderCanvases: (folderId: string) => Promise<void>;
  refreshSingleCanvas: (canvasId: string) => Promise<any>;
}

const initialState: DocumentState = {
  id: "",
  name: "Untitled Document",
  description: "",
  user_id: "",
  code: null,
  visibility: "private",
  editor_state: null,
  version: 1,
  canvas_id: "",
  loadedCanvasId: null,
  isLoading: true,
  folderLoading: false,
  saveLoading: false,
  error: null,
  conflict: null,
  loadFailed: false,
  isDirty: false,
  lastSaved: null,
  aiApplySeq: 0,
  aiAppliedDoc: null,
  aiAppliedCanvasId: null,
  setName: () => {},
  setDescription: () => {},
  updateEditorState: () => {},
  applyDocumentContent: () => {},
  loadDocument: async () => {},
  reloadDocument: async () => {},
  saveDocument: async () => {},
  resolveConflictKeepMine: async () => {},
  resolveConflictTakeTheirs: () => {},
  dismissConflict: () => {},
  applyRemoteChange: () => {},
  syncChanges: () => {},
  resetState: () => {},
  loadFolderCanvases: async () => {},
  refreshSingleCanvas: async () => Promise.resolve(),
  folderCanvases: [],
  folder: null,
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => {
      // Create a debounced version of saveDocument that we'll use for syncing
      // Single 2000ms debounce, matching the editor's autosave timer so a doc
      // edit can't be written twice by two timers (which, under the optimistic
      // version check, could even race into a spurious self-conflict). This
      // path now only serves name/description edits (setName/setDescription);
      // editor content saves go through the editor's triggerAutoSave directly.
      const debouncedSave = debounce(async () => {
        if (get().isDirty) {
          await get().saveDocument();
        }
      }, 2000);

      // Throttle the save-error toast/log so an expired session or dropped
      // network doesn't flood the console on every keystroke-triggered save.
      let lastSaveErrorAt = 0;
      const reportSaveError = (error: unknown) => {
        const now = Date.now();
        if (now - lastSaveErrorAt > 8000) {
          lastSaveErrorAt = now;
          console.error("Error saving document:", error);
          const msg =
            error instanceof Error ? error.message : String(error ?? "");
          if (isAuthError(error)) {
            toast.error("Your session expired — please reload to sign back in.");
          } else {
            toast.error("Failed to save document");
          }
        }
      };

      return {
        ...initialState,
        setName: (name) => {
          set({ name, isDirty: true });
          get().syncChanges();
        },
        setDescription: (description) => {
          set({ description, isDirty: true });
          get().syncChanges();
        },
        updateEditorState: (editorState) => {
          const stateToStore =
            typeof editorState === "string"
              ? editorState
              : JSON.stringify(editorState);

          // Update local state immediately but don't trigger unnecessary re-renders
          set((state) => {
            // Only update if state actually changed to prevent focus loss
            if (state.editor_state !== stateToStore) {
              return {
                editor_state: stateToStore,
                isDirty: true,
              };
            }
            return state; // Return unchanged state if nothing changed
          });
          // NOTE: no debounced save is scheduled here. The editor's
          // triggerAutoSave (which calls this right before awaiting
          // saveDocument) is the single autosave path for editor content, so a
          // second timer firing the same write is avoided.
        },
        applyDocumentContent: (json, version) => {
          // Push agent-authored content into the open editor. The server apply
          // already persisted it, so mark clean (no autosave) and bump the
          // signal the editor effect watches. The editor re-applies via
          // setContent under its isApplyingRemoteRef guard, so this does NOT
          // round-trip back through autosave.
          set((state) => ({
            aiAppliedDoc: json,
            aiAppliedCanvasId: state.canvas_id,
            aiApplySeq: state.aiApplySeq + 1,
            isDirty: false,
            lastSaved: new Date(),
            // The server apply already bumped the row's version; adopt it so the
            // next user save's optimistic check doesn't see a stale version and
            // wrongly report a conflict.
            ...(typeof version === "number" ? { version } : {}),
          }));
        },
        reloadDocument: async () => {
          const id = get().canvas_id;
          if (!id) return;
          await get().loadDocument(id);
        },
        loadDocument: async (canvasId) => {
          set({
            isLoading: true,
            error: null,
            loadFailed: false,
            canvas_id: canvasId,
            // Invalidate the completion marker for the in-flight window so the
            // editor's loader waits for THIS doc rather than acting on the
            // previous doc's content.
            loadedCanvasId: null,
          });
          try {
            const { data: canvas, error: canvasError } = await supabase
              .from("canvas")
              .select(
                "id, name, code, description, folder_id, document_data(*), user_id, visibility, folder:folder!canvas_folder_id_fkey(*)"
              )
              .eq("id", canvasId)
              .single();

            if (canvasError) throw canvasError;

            const documentData =
              canvas?.document_data && canvas?.document_data?.length > 0
                ? canvas?.document_data[0]
                : null;

            set({
              id: documentData?.id || "",
              name: canvas.name,
              code: (canvas as any).code ?? null,
              description: canvas.description || "",
              editor_state: documentData?.lexical_state || null,
              version: documentData?.version || 1,
              canvas_id: canvasId,
              // Mark the load complete for THIS doc in the same set() that
              // populates editor_state — this is the signal the editor loader
              // gates on, guaranteeing editor_state is this doc's content.
              loadedCanvasId: canvasId,
              isLoading: false,
              isDirty: false,
              lastSaved: documentData
                ? new Date(documentData.updated_at)
                : null,
              user_id: canvas.user_id,
              visibility: (canvas as any).visibility || "private",
              folder: canvas.folder,
            });

            get().loadFolderCanvases(canvas.folder_id);
          } catch (error) {
            console.error("Error loading document:", error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load document",
              isLoading: false,
              loadFailed: true,
            });
          }
        },
        saveDocument: async () => {
          const state = get();
          if (!state.canvas_id) return;
          set({ saveLoading: true });

          const sameState = (a: any, b: any): boolean => {
            try {
              const na = typeof a === "string" ? a : JSON.stringify(a);
              const nb = typeof b === "string" ? b : JSON.stringify(b);
              return na === nb;
            } catch {
              return false;
            }
          };

          type WriteResult =
            | { status: "ok"; version: number }
            | { status: "conflict"; currentVersion: number; serverState: any };

          // One save attempt. Uses an optimistic-concurrency check: the content
          // update only lands if the row is still at the version we loaded
          // (`WHERE version = expected`). If nothing matched, the document was
          // written elsewhere since — surfaced as a conflict instead of a silent
          // last-write-wins overwrite. Safe to retry: a retry after a committed-
          // but-lost-response write detects its own prior write and reports ok.
          const performWrite = async (): Promise<WriteResult> => {
            const now = new Date().toISOString();
            const latestEditorState = state.editor_state;

            const { data: existingDocs, error: checkError } = await supabase
              .from("document_data")
              .select("canvas_id, version, lexical_state")
              .eq("canvas_id", state.canvas_id);
            if (checkError) throw checkError;
            const existing = existingDocs && existingDocs[0];

            let nextVersion: number;
            if (!existing) {
              const { error: insertError } = await supabase
                .from("document_data")
                .insert({
                  lexical_state: latestEditorState,
                  version: 1,
                  canvas_id: state.canvas_id,
                  updated_at: now,
                });
              if (insertError) throw insertError;
              nextVersion = 1;
            } else {
              nextVersion = state.version + 1;
              const { data: updated, error: updateError } = await supabase
                .from("document_data")
                .update({
                  lexical_state: latestEditorState,
                  version: nextVersion,
                  updated_at: now,
                })
                .eq("canvas_id", state.canvas_id)
                .eq("version", state.version) // optimistic-concurrency guard
                .select("version");
              if (updateError) throw updateError;

              if (!updated || updated.length === 0) {
                // Either a genuine concurrent write, OR our own prior attempt
                // that committed before a transient error (retry). If the stored
                // content already matches what we're writing at the next
                // version, treat it as success.
                if (
                  existing.version === nextVersion &&
                  sameState(existing.lexical_state, latestEditorState)
                ) {
                  return { status: "ok", version: nextVersion };
                }
                return {
                  status: "conflict",
                  currentVersion: existing.version,
                  serverState: existing.lexical_state,
                };
              }
            }

            // Canvas metadata is best-effort — the content (the important part)
            // is already committed, so a name/description write failure must not
            // fail the whole save.
            const { error: canvasError } = await supabase
              .from("canvas")
              .update({
                name: state.name,
                description: state.description,
                updated_at: now,
              })
              .eq("id", state.canvas_id);
            if (canvasError) {
              console.error(
                "Canvas metadata update failed (content was saved):",
                canvasError
              );
            }

            return { status: "ok", version: nextVersion };
          };

          // Retry transient (network/5xx) failures with backoff; an expired
          // token is refreshed once and retried separately. Conflicts are a
          // normal return value (not thrown) so they're never retried.
          const runSave = async (): Promise<WriteResult> => {
            try {
              return await retryWithBackoff(performWrite, {
                retries: 3,
                baseMs: 400,
                shouldRetry: isTransientError,
              });
            } catch (error) {
              if (isAuthError(error)) {
                const { error: refreshError } =
                  await supabase.auth.refreshSession();
                if (refreshError) throw error;
                return await retryWithBackoff(performWrite, {
                  retries: 2,
                  baseMs: 400,
                  shouldRetry: isTransientError,
                });
              }
              throw error;
            }
          };

          try {
            const result = await runSave();

            if (result.status === "conflict") {
              // Do NOT overwrite. Keep the local edits dirty and record the
              // conflict — the editor surfaces the resolution chooser. No error
              // toast/log here: a conflict is a normal, handled outcome, not a
              // failure.
              set({
                saveLoading: false,
                conflict: {
                  serverVersion: result.currentVersion,
                  serverState: result.serverState,
                },
              });
              return;
            }

            set({
              isDirty: false,
              lastSaved: new Date(),
              version: result.version,
              saveLoading: false,
              error: null,
              conflict: null,
            });
          } catch (error) {
            reportSaveError(error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to save document",
              saveLoading: false,
              // Leave isDirty=true so the next edit retries the save.
            });
          }
        },
        resolveConflictKeepMine: async () => {
          const { conflict, canvas_id } = get();
          if (!conflict) return;
          // The server copy is about to be overwritten — preserve it.
          backupConflictLoser(canvas_id, "theirs", conflict.serverState);
          // Re-base onto the current server version so our optimistic-concurrency
          // check matches, then write our content (which now wins).
          set({ version: conflict.serverVersion, conflict: null });
          await get().saveDocument();
        },
        resolveConflictTakeTheirs: () => {
          const { conflict, canvas_id, editor_state } = get();
          if (!conflict) return;
          // Our local copy is about to be replaced — preserve it.
          backupConflictLoser(canvas_id, "mine", editor_state);
          let json: any = null;
          try {
            const parsed =
              typeof conflict.serverState === "string"
                ? JSON.parse(conflict.serverState)
                : conflict.serverState;
            json = parsed?.json ?? parsed ?? null;
          } catch {
            json = null;
          }
          // Route through the guarded re-apply (isApplyingRemoteRef) so it
          // doesn't round-trip through autosave or re-enter the one-shot loader.
          if (json) get().applyDocumentContent(json, conflict.serverVersion);
          set({
            version: conflict.serverVersion,
            editor_state: conflict.serverState,
            isDirty: false,
            conflict: null,
          });
        },
        dismissConflict: () => set({ conflict: null }),
        applyRemoteChange: (newVersion, newState) => {
          const { version, isDirty } = get();
          // Ignore our own write (version already adopted) and stale echoes.
          if (typeof newVersion !== "number" || newVersion <= version) return;
          if (isDirty) {
            // Local unsaved edits diverge from a newer server copy → let the
            // user choose (same conflict surface the save-time check produces).
            set({
              conflict: { serverVersion: newVersion, serverState: newState },
            });
          } else {
            // No local edits → silently adopt the remote content.
            let json: any = null;
            try {
              const parsed =
                typeof newState === "string" ? JSON.parse(newState) : newState;
              json = parsed?.json ?? parsed ?? null;
            } catch {
              json = null;
            }
            if (json) get().applyDocumentContent(json, newVersion);
            set({ version: newVersion, editor_state: newState });
          }
        },
        syncChanges: () => {
          // Just trigger the debounced save function
          debouncedSave();
        },
        resetState: () => {
          // Cancel any pending debounced saves
          debouncedSave.cancel();
          set(initialState);
        },
        loadFolderCanvases: async (folderId: string | null) => {
          // NOTE: do not touch the shared `error` field here. This is a
          // secondary fetch (the insert-picker list); a failure must not be
          // mistaken for a document-load failure, which would block autosave.
          // Uses `folderLoading`, NOT `isLoading`, so it never blocks the
          // editor's content render (which gates on `isLoading`).
          set({ folderLoading: true });

          // if (!folderId) {
          //   set({ folderCanvases: [] });
          //   return;
          // }

          try {
            // Get current user
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              throw new Error("User not authenticated");
            }

            // A2 — light folder query: fetch only metadata + (small) column
            // definitions. The big `canvas_data` blob (nodes/edges/styles for
            // EVERY folder canvas) is NOT loaded here; the insert dialogs fetch
            // it fresh per-item on selection (refreshSingleCanvas), and table
            // embeds upgrade themselves the same way. Massively trims the
            // open-document payload.
            let query = supabase
              .from("canvas")
              .select(
                `
          id,
          name,
          canvas_type,
          description,
          updated_at,
          columns:column_definition!column_definition_canvas_id_fkey(*)
        `
              )
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false });

            if (folderId !== null) {
              query = query.eq("folder_id", folderId);
            } else {
              query = query.is("folder_id", null);
            }

            const { data, error } = await query;

            if (error) throw error;

            set({
              folderCanvases: data.map((canvas) => ({
                id: canvas.id,
                name: canvas.name,
                canvas_type: canvas.canvas_type,
                description: canvas.description || "",
                updated_at: new Date(canvas.updated_at),
                columns: canvas.columns,
                // Heavy flow/table data is fetched on demand (insert dialog
                // selection / table-embed upgrade), not in this light load.
                flowData: null,
              })),
            });
          } catch (error) {
            console.error("Error loading folder canvases:", error);
            // Intentionally NOT setting the shared `error` field — see note
            // above. The insert-picker list staying empty is non-fatal.
          } finally {
            set({ folderLoading: false });
          }
        },

        refreshSingleCanvas: async (canvasId: string) => {
          try {
            // Get current user
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              throw new Error("User not authenticated");
            }

            // Fetch the specific canvas with fresh data
            const { data, error } = await supabase
              .from("canvas")
              .select(
                `
                id, 
                name,
                canvas_type,
                description, 
                updated_at, 
                columns:column_definition!column_definition_canvas_id_fkey(*), 
                data:canvas_data(*)
              `
              )
              .eq("id", canvasId)
              .eq("user_id", user.id)
              .single();

            if (error) {
              console.error("Error fetching canvas:", error);
              throw error;
            }

            if (!data) {
              throw new Error("Canvas not found");
            }

            const fresh = {
              id: data.id,
              name: data.name,
              canvas_type: data.canvas_type,
              description: data.description || "",
              updated_at: new Date(data.updated_at),
              columns: data.columns,
              flowData: data.data ? data.data : null,
            };

            // Upsert into folderCanvases: the light folder load may not contain
            // this canvas at all (e.g. a table embed whose source lives in a
            // different folder), so add it when missing instead of silently
            // dropping the fresh data on the floor.
            set((state) => {
              const exists = state.folderCanvases.some(
                (c) => c.id === canvasId
              );
              return {
                folderCanvases: exists
                  ? state.folderCanvases.map((c) =>
                      c.id === canvasId ? fresh : c
                    )
                  : [...state.folderCanvases, fresh],
              };
            });

            return fresh;
          } catch (error) {
            console.error("Error refreshing single canvas:", error);
            throw error;
          }
        },
      };
    },
    {
      name: "document-store",
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        description: state.description,
        canvas_id: state.canvas_id,
        version: state.version,
      }),
    }
  )
);
