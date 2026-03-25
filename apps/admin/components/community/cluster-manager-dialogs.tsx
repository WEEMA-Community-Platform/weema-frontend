"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon, UsersIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useAddSHGsToClusterMutation,
  useClusterDetailQuery,
  useRemoveSHGFromClusterMutation,
} from "@/hooks/use-community";
import type { Cluster, EntityStatus, SHG } from "@/lib/api/community";
import { getSHGs } from "@/lib/api/community";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/community/community-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton, inputClass } from "@/components/base-data/shared";
import { SelectField } from "@/components/base-data/select-field";

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium wrap-break-word">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </dd>
    </>
  );
}

export function AssignSHGsDialog({
  cluster,
  open,
  onClose,
}: {
  cluster: Cluster | null;
  open: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: unassignedData, isLoading: unassignedLoading } = useQuery({
    queryKey: ["shgs", { assignClusterUnassigned: true }],
    queryFn: () => getSHGs({ pageSize: 200, unassignedCluster: true }),
    enabled: open && !!cluster,
  });

  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ["shgs", { clusterId: cluster?.id, assignModalAssigned: true }],
    queryFn: () => getSHGs({ clusterId: cluster!.id, pageSize: 200 }),
    enabled: open && !!cluster,
  });

  const addMutation = useAddSHGsToClusterMutation();
  const removeMutation = useRemoveSHGFromClusterMutation();

  const assignable = unassignedData?.selfHelpGroups ?? [];
  const assignedShgs = assignedData?.selfHelpGroups ?? [];
  const filtered = search
    ? assignable.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : assignable;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    setSearch("");
    setSelectedIds(new Set());
    setPendingRemove(null);
    onClose();
  };

  const confirmRemoveAssigned = async () => {
    if (!pendingRemove || !cluster) return;
    const target = pendingRemove;
    setPendingRemove(null);
    setRemovingId(target.id);
    try {
      await removeMutation.mutateAsync({ clusterId: cluster.id, shgId: target.id });
      sileo.success({ title: "SHG removed from cluster" });
    } catch (error) {
      sileo.error({
        title: "Could not remove SHG",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAssign = async () => {
    if (!cluster || selectedIds.size === 0) return;
    try {
      const result = await addMutation.mutateAsync({
        clusterId: cluster.id,
        shgIds: [...selectedIds],
      });
      sileo.success({ title: "SHGs assigned", description: result.message });
      handleClose();
    } catch (error) {
      sileo.error({
        title: "Could not assign SHGs",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign self-help groups</DialogTitle>
            <DialogDescription>
              Manage SHGs for{" "}
              <span className="font-medium text-foreground">{cluster?.name}</span>. Remove assigned
              groups here or add groups without a cluster.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-2 space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Assigned to this cluster
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                {assignedLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-11 w-full" />
                    ))}
                  </div>
                ) : assignedShgs.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center text-muted-foreground">
                    No self-help groups assigned yet.
                  </p>
                ) : (
                  assignedShgs.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <UsersIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.kebeleName ?? s.woredaName ?? "No location"}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 size-9 text-destructive hover:text-destructive border border-transparent hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/10"
                        disabled={removingId === s.id || removeMutation.isPending}
                        onClick={() => setPendingRemove({ id: s.id, name: s.name })}
                        aria-label="Remove self-help group from cluster"
                      >
                        {removingId === s.id ? (
                          <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden />
                        ) : (
                          <Trash2Icon className="size-4" aria-hidden />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Add SHGs (no cluster assigned)
              </p>
              <Input
                placeholder="Search self-help groups…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass}
              />
              <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                {unassignedLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                    {search
                      ? "No self-help groups match your search."
                      : "No SHGs available without a cluster."}
                  </p>
                ) : (
                  filtered.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggle(s.id)}
                        className="size-4 rounded accent-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.woredaName ?? "No woreda"}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </label>
                  ))
                )}
              </div>
              {unassignedData && assignable.length < unassignedData.totalElements && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing {assignable.length} of {unassignedData.totalElements} unassigned SHGs. Refine
                  search if needed.
                </p>
              )}
              {selectedIds.size > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedIds.size} SHG{selectedIds.size !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} type="button">Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={selectedIds.size === 0 || addMutation.isPending}
              type="button"
            >
              {addMutation.isPending
                ? "Assigning…"
                : `Assign${selectedIds.size > 0 ? ` ${selectedIds.size}` : ""} SHG${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => { if (!o) setPendingRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove self-help group</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              <span className="font-semibold text-foreground">{pendingRemove?.name}</span> from this
              cluster? The SHG will remain in the system but will no longer be linked here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemoveAssigned}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ClusterDetailDialog({ id, open, onClose }: { id: string | null; open: boolean; onClose: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(id);

  useEffect(() => {
    if (open && id) setActiveId(id);
  }, [open, id]);

  const { data, isLoading, isError, error, refetch } = useClusterDetailQuery(activeId);
  const { data: shgsData, isLoading: shgsLoading } = useQuery({
    queryKey: ["shgs", { clusterId: activeId }],
    queryFn: () => getSHGs({ clusterId: activeId!, pageSize: 200 }),
    enabled: !!activeId && open,
  });
  const removeMutation = useRemoveSHGFromClusterMutation();
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const cluster = data?.cluster;
  const shgs = shgsData?.selfHelpGroups ?? [];

  const confirmRemove = async () => {
    if (!pendingRemove || !activeId) return;
    const target = pendingRemove;
    setPendingRemove(null);
    setRemovingId(target.id);
    try {
      await removeMutation.mutateAsync({ clusterId: activeId, shgId: target.id });
      sileo.success({ title: "SHG removed from cluster" });
    } catch (error) {
      sileo.error({
        title: "Could not remove SHG",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="w-[min(100vw-1.5rem,42rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{cluster?.name ?? "Cluster details"}</DialogTitle>
            <DialogDescription>Full details for this cluster.</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-2 space-y-4 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : isError ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Could not load details."}
                </p>
                <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-primary hover:underline">
                  Retry
                </button>
              </div>
            ) : cluster ? (
              <>
                <dl className="grid grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_112px_minmax(0,1fr)] gap-x-3 gap-y-2.5">
                  <DetailField label="Name" value={cluster.name} />
                  <DetailField label="Woreda" value={cluster.woredaName} />
                  <DetailField label="Federation" value={cluster.federationName} />
                  <DetailField label="Status" value={<StatusBadge status={cluster.status} />} />
                  <DetailField label="Manager" value={cluster.managerName} />
                  <DetailField label="Description" value={cluster.description} />
                </dl>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-3">
                    Self-Help Groups
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({shgsLoading ? "…" : shgs.length})
                    </span>
                  </p>
                  {shgsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-11 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : shgs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-1">No self-help groups assigned yet.</p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
                      {shgs.map((s: SHG) => (
                        <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-muted/40 ring-1 ring-border/40">
                          <UsersIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.kebeleName ?? s.woredaName ?? "No location"}
                            </p>
                          </div>
                          <StatusBadge status={s.status} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 size-9 text-destructive hover:text-destructive border border-transparent hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/10"
                            onClick={() => setPendingRemove({ id: s.id, name: s.name })}
                            disabled={removingId === s.id}
                            aria-label="Remove self-help group from cluster"
                          >
                            {removingId === s.id ? (
                              <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden />
                            ) : (
                              <Trash2Icon className="size-4" aria-hidden />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => { if (!o) setPendingRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove self-help group</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <span className="font-semibold text-foreground">{pendingRemove?.name}</span> from this cluster? The SHG will remain in the system but will no longer be linked here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ClusterFormDialog({
  open,
  onOpenChange,
  editingCluster,
  name,
  description,
  status,
  woredaId,
  woredaOptions,
  statusOptions,
  setName,
  setDescription,
  setStatus,
  setWoredaId,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCluster: Cluster | null;
  name: string;
  description: string;
  status: EntityStatus | "";
  woredaId: string;
  woredaOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setStatus: (value: EntityStatus | "") => void;
  setWoredaId: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,50rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={onSubmit}>
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>{editingCluster ? "Edit cluster" : "Add cluster"}</DialogTitle>
            <DialogDescription>
              {editingCluster
                ? "Update cluster details. Federation membership is managed from the federation’s Assign clusters flow."
                : "Add a new cluster to the community structure. Link it to a federation from that federation’s Assign clusters action."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
              <div className="space-y-1.5">
                <Label htmlFor="cluster-name">Name</Label>
                <Input
                  id="cluster-name"
                  placeholder="Cluster name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cluster-woreda">Woreda</Label>
                  <SelectField
                    id="cluster-woreda"
                    value={woredaId}
                    onValueChange={setWoredaId}
                    options={woredaOptions}
                    placeholder="Select woreda"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cluster-status">Status</Label>
                  <SelectField
                    id="cluster-status"
                    value={status}
                    onValueChange={(v) => setStatus(v as EntityStatus | "")}
                    options={statusOptions}
                    placeholder="Select status"
                    className="h-11"
                  />
                </div>
              </div>
              {editingCluster ? (
                <div className="space-y-1.5">
                  <Label>Federation</Label>
                  <p className="text-xs text-muted-foreground">
                    Assign or remove this cluster from a federation using{" "}
                    <span className="font-medium text-foreground">Assign clusters</span> on the
                    federation card, not here.
                  </p>
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
                    {editingCluster.federationName ?? (
                      <span className="text-muted-foreground">Not assigned to a federation</span>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="cluster-description">Description</Label>
                <textarea
                  id="cluster-description"
                  className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Optional notes about this cluster"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end border-t border-border/60 px-6 py-4">
            <SaveButton
              isPending={isSubmitting}
              idleLabel={editingCluster ? "Save cluster" : "Add cluster"}
              pendingLabel={editingCluster ? "Saving…" : "Adding…"}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClusterDeleteDialog({
  pendingDelete,
  onOpenChange,
  onConfirmDelete,
}: {
  pendingDelete: Cluster | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}) {
  return (
    <AlertDialog open={!!pendingDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete cluster</AlertDialogTitle>
          <AlertDialogDescription>
            Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void onConfirmDelete()}>
            Delete cluster
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
