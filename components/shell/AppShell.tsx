"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, FolderInput, Inbox, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SidebarInset } from "@/components/ui/sidebar";
import { CreateNewModal } from "@/components/dashboard-sidebar/create-new-modal";
import { useUser } from "@/lib/contexts/userContext";
import { useHomeManagement } from "@/components/dashboard/use-home-management";
import {
  getUserFeatureLimits,
  SubscriptionFeatureFlag,
} from "@/lib/subscription-features";
import { CANVAS_TYPE } from "@/types/store";
import { TopBar } from "./TopBar";
import { LibrarySidebar } from "./LibrarySidebar";

type ItemKind = "folder" | "canvas";

/**
 * The Atlas app shell for the Library/Collection surfaces: the left
 * LibrarySidebar + the TopBar over the page content. It also centralises all
 * library CRUD (create / rename / delete) so the sidebar, the Library and
 * Collection views can all trigger it via window events — one CreateNewModal, one
 * delete confirm, one source of plan-limit truth.
 *
 * Events: `olab:create-new` {type?, folderId?}, `olab:rename-item`
 * {id, name, kind}, `olab:delete-item` {id, name, kind}.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const {
    folders,
    rootCanvases,
    createFolder,
    createCanvas,
    updateFolder,
    updateCanvas,
    deleteFolder,
    deleteCanvas,
    moveCanvas,
    refreshData,
  } = useHomeManagement(user);

  const [planLimits, setPlanLimits] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number }>({
    used: 0,
    limit: 5,
  });
  const [error, setError] = useState<string | null>(null);

  const [createType, setCreateType] = useState<ItemKind | null>(null);
  const [createFolderId, setCreateFolderId] = useState<string | null>(null);
  const [rename, setRename] = useState<{
    id: string;
    name: string;
    kind: ItemKind;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [del, setDel] = useState<{
    id: string;
    name: string;
    kind: ItemKind;
  } | null>(null);
  const [move, setMove] = useState<{
    id: string;
    name: string;
    folderId: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // ── plan limits + AI usage (free-tier gating) ──────────────────────────────
  const loadAiUsage = useCallback(async () => {
    try {
      const r = await fetch("/api/ai/usage");
      if (r.ok) {
        const u = await r.json();
        setAiUsage({ used: u.used ?? 0, limit: u.limit ?? 5 });
      }
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const r = await fetch("/api/subscription/status");
        setPlanLimits(
          r.ok ? (await r.json()).limits : await getUserFeatureLimits(user.id)
        );
      } catch {
        setPlanLimits(await getUserFeatureLimits(user.id));
      }
      await loadAiUsage();
    })();
  }, [user?.id, loadAiUsage]);

  const hybridCount = () =>
    rootCanvases.filter(
      (c: any) => c.canvas_type === "hybrid" || !c.canvas_type
    ).length;
  const hasDiagramSlots = () =>
    planLimits
      ? hybridCount() < planLimits[SubscriptionFeatureFlag.MAX_DIAGRAMS]
      : true;

  // ── create / rename / delete ───────────────────────────────────────────────
  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (name.trim() && user?.id) {
        try {
          await createFolder(name, user.id);
          await refreshData();
        } catch {
          setError("Couldn't create the collection. Please try again.");
        }
      }
      setCreateType(null);
    },
    [createFolder, user?.id, refreshData]
  );

  const handleCreateCanvas = useCallback(
    async (
      name: string,
      description: string,
      type: CANVAS_TYPE,
      folderId?: string | null
    ) => {
      setError(null);
      if (planLimits && type === CANVAS_TYPE.HYBRID && !hasDiagramSlots()) {
        const max = planLimits[SubscriptionFeatureFlag.MAX_DIAGRAMS];
        setError(`You've reached your limit of ${max} diagram(s). Upgrade to create more.`);
        setCreateType(null);
        router.push("/pricing");
        return false;
      }
      try {
        const id = await createCanvas(
          name,
          description,
          user?.id as string,
          folderId as string,
          type
        );
        if (!folderId) await refreshData();
        if (id) {
          window.location.href =
            type === CANVAS_TYPE.DOCUMENT
              ? `/protected/document-editor/${id}`
              : `/protected/playbook/${id}`;
        }
      } catch {
        setError("Couldn't create that. Please try again.");
      }
      setCreateType(null);
      setCreateFolderId(null);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createCanvas, user?.id, refreshData, planLimits, rootCanvases, router]
  );

  const submitRename = useCallback(async () => {
    if (!rename || !renameValue.trim()) return;
    setBusy(true);
    try {
      if (rename.kind === "folder")
        await updateFolder(rename.id, renameValue.trim());
      else await updateCanvas(rename.id, renameValue.trim());
      await refreshData();
      setRename(null);
    } catch {
      setError("Couldn't rename that. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [rename, renameValue, updateFolder, updateCanvas, refreshData]);

  const confirmDelete = useCallback(async () => {
    if (!del) return;
    setBusy(true);
    try {
      if (del.kind === "folder") await deleteFolder(del.id);
      else await deleteCanvas(del.id);
      await refreshData();
      setDel(null);
    } catch {
      setError("Couldn't delete that. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [del, deleteFolder, deleteCanvas, refreshData]);

  // Move an artifact into a collection (or out of one → uncategorized). moveCanvas
  // only optimistically updates `folders`, never `rootCanvases`, so a refresh after
  // keeps the Library's merged list correct.
  const submitMove = useCallback(
    async (targetFolderId: string | null) => {
      if (!move || targetFolderId === move.folderId) {
        setMove(null);
        return;
      }
      setBusy(true);
      try {
        await moveCanvas(move.id, targetFolderId);
        await refreshData();
        setMove(null);
      } catch {
        setError("Couldn't move that. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [move, moveCanvas, refreshData]
  );

  // ── window-event wiring (sidebar / cards trigger CRUD) ─────────────────────
  useEffect(() => {
    const onCreate = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      setCreateFolderId(d.folderId ?? null);
      setCreateType(d.type ?? "canvas");
    };
    const onRename = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.id) {
        setRename(d);
        setRenameValue(d.name ?? "");
      }
    };
    const onDelete = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.id) setDel(d);
    };
    const onMove = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.id)
        setMove({ id: d.id, name: d.name, folderId: d.folderId ?? null });
    };
    window.addEventListener("olab:create-new", onCreate);
    window.addEventListener("olab:rename-item", onRename);
    window.addEventListener("olab:delete-item", onDelete);
    window.addEventListener("olab:move-item", onMove);
    return () => {
      window.removeEventListener("olab:create-new", onCreate);
      window.removeEventListener("olab:rename-item", onRename);
      window.removeEventListener("olab:delete-item", onDelete);
      window.removeEventListener("olab:move-item", onMove);
    };
  }, []);

  return (
    <>
      <LibrarySidebar />
      <SidebarInset className="flex h-svh min-w-0 flex-col">
        <TopBar />
        <main className="relative min-h-0 flex-1 overflow-y-auto bg-paper">
          {error && (
            <div className="pointer-events-auto absolute left-1/2 top-4 z-50 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-atlas-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-1 rounded p-0.5 hover:bg-destructive/10"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
      </SidebarInset>

      {/* Create — one modal for the whole shell */}
      <CreateNewModal
        isOpen={Boolean(createType)}
        onClose={() => {
          setCreateType(null);
          setCreateFolderId(null);
          loadAiUsage();
        }}
        onCreateFolder={handleCreateFolder}
        // @ts-ignore — handleCreateCanvas returns Promise<boolean>; modal expects boolean
        onCreateCanvas={handleCreateCanvas}
        folders={folders}
        type={createType}
        currentFolderId={createFolderId}
        rootCanvases={rootCanvases}
        canCreateCanvas={(type?: CANVAS_TYPE) =>
          type === CANVAS_TYPE.TABLE ? true : hasDiagramSlots()
        }
        onCanvasLimitReached={() => {
          const max = planLimits?.[SubscriptionFeatureFlag.MAX_DIAGRAMS] || 1;
          setError(`You've reached your limit of ${max} diagram(s). Delete one or upgrade to create more.`);
          router.push("/pricing");
        }}
        canUseAI={() => aiUsage.used < aiUsage.limit && hasDiagramSlots()}
        onAILimitReached={() => {
          if (aiUsage.used >= aiUsage.limit) {
            setError(`You've used all ${aiUsage.limit} AI calls this month. Upgrade to Pro for unlimited AI generation.`);
          } else if (!hasDiagramSlots()) {
            const max = planLimits?.[SubscriptionFeatureFlag.MAX_DIAGRAMS] || 1;
            setError(`You've reached your limit of ${max} diagram(s). Delete one or upgrade to create more.`);
          }
          router.push("/pricing");
        }}
      />

      {/* Rename */}
      <Dialog
        open={Boolean(rename)}
        onOpenChange={(o) => !o && setRename(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Rename {rename?.kind === "folder" ? "collection" : "artifact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              id="rename-input"
              aria-label={`Rename ${
                rename?.kind === "folder" ? "collection" : "artifact"
              }`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              maxLength={50}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setRename(null)}>
                Cancel
              </Button>
              <Button
                variant="signal"
                onClick={submitRename}
                disabled={busy || !renameValue.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to a collection (or back out → uncategorized) */}
      <Dialog open={Boolean(move)} onOpenChange={(o) => !o && setMove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Move to collection</DialogTitle>
            <DialogDescription className="truncate">
              {move?.name || "Untitled"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="-mx-1 max-h-72 space-y-0.5 overflow-y-auto px-1">
              <MoveRow
                label="No collection"
                hint="Uncategorized"
                icon={<Inbox className="h-4 w-4" />}
                current={(move?.folderId ?? null) === null}
                disabled={busy}
                onClick={() => submitMove(null)}
              />
              {folders.map((f: any) => (
                <MoveRow
                  key={f.id}
                  label={f.name}
                  icon={<FolderInput className="h-4 w-4" />}
                  current={move?.folderId === f.id}
                  disabled={busy}
                  onClick={() => submitMove(f.id)}
                />
              ))}
            </div>
            {folders.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">
                You don&apos;t have any collections yet. Create one from the
                sidebar to group artifacts.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete — Atlas confirm with consequences */}
      <ConfirmDialog
        open={Boolean(del)}
        onOpenChange={(o) => !o && setDel(null)}
        destructive
        loading={busy}
        title={`Delete ${del?.kind === "folder" ? "collection" : "artifact"}?`}
        description={
          del?.kind === "folder" ? (
            <>
              Delete <span className="font-medium text-foreground">{del?.name}</span>?
              Its artifacts won't be deleted — they become uncategorized.
            </>
          ) : (
            <>
              Delete <span className="font-medium text-foreground">{del?.name}</span>?
              This can't be undone.
            </>
          )
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </>
  );
}

/** One destination row in the "Move to collection" dialog. */
function MoveRow({
  label,
  hint,
  icon,
  current,
  disabled,
  onClick,
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  current: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || current}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {current ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5" /> Current
        </span>
      ) : hint ? (
        <span className="shrink-0 text-xs text-faint-ink">{hint}</span>
      ) : null}
    </button>
  );
}

export default AppShell;
