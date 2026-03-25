"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayersIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { sileo } from "sileo";

import {
  useAddClustersToFederationMutation,
  useFederationDetailQuery,
  useRemoveClusterFromFederationMutation,
} from "@/hooks/use-community";
import type { Cluster, EntityStatus, Federation } from "@/lib/api/community";
import { getClusters } from "@/lib/api/community";
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

export function AssignClustersDialog({
  federation,
  open,
  onClose,
}: {
  federation: Federation | null;
  open: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: unassignedData, isLoading: unassignedLoading } = useQuery({
    queryKey: ["clusters", { assignFederationUnassigned: true }],
    queryFn: () => getClusters({ pageSize: 200, unAssignedFederation: true }),
    enabled: open && !!federation,
  });

  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ["clusters", { federationId: federation?.id, assignModalAssigned: true }],
    queryFn: () => getClusters({ federationId: federation!.id, pageSize: 200 }),
    enabled: open && !!federation,
  });

  const addMutation = useAddClustersToFederationMutation();
  const removeMutation = useRemoveClusterFromFederationMutation();

  const assignable = unassignedData?.clusters ?? [];
  const assignedClusters = assignedData?.clusters ?? [];
  const filtered = search
    ? assignable.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
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
    if (!pendingRemove || !federation) return;
    const target = pendingRemove;
    setPendingRemove(null);
    setRemovingId(target.id);
    try {
      await removeMutation.mutateAsync({ federationId: federation.id, clusterId: target.id });
      sileo.success({ title: "Cluster removed from federation" });
    } catch (error) {
      sileo.error({
        title: "Could not remove cluster",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAssign = async () => {
    if (!federation || selectedIds.size === 0) return;
    try {
      const result = await addMutation.mutateAsync({
        federationId: federation.id,
        clusterIds: [...selectedIds],
      });
      sileo.success({ title: "Clusters assigned", description: result.message });
      handleClose();
    } catch (error) {
      sileo.error({
        title: "Could not assign clusters",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign clusters</DialogTitle>
            <DialogDescription>
              Manage clusters for{" "}
              <span className="font-medium text-foreground">{federation?.name}</span>. Remove assigned
              clusters here or add clusters that are not linked to a federation.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-2 space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Assigned to this federation
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                {assignedLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-11 w-full" />
                    ))}
                  </div>
                ) : assignedClusters.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center text-muted-foreground">
                    No clusters assigned yet.
                  </p>
                ) : (
                  assignedClusters.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <LayersIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.woredaName}</p>
                      </div>
                      <StatusBadge status={c.status} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 size-9 text-destructive hover:text-destructive border border-transparent hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/10"
                        disabled={removingId === c.id || removeMutation.isPending}
                        onClick={() => setPendingRemove({ id: c.id, name: c.name })}
                        aria-label="Remove cluster from federation"
                      >
                        {removingId === c.id ? (
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
                Add clusters (unassigned to a federation)
              </p>
              <Input
                placeholder="Search clusters…"
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
                      ? "No clusters match your search."
                      : "No clusters available without a federation."}
                  </p>
                ) : (
                  filtered.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggle(c.id)}
                        className="size-4 rounded accent-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.woredaName}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </label>
                  ))
                )}
              </div>
              {unassignedData && assignable.length < unassignedData.totalElements && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing {assignable.length} of {unassignedData.totalElements} unassigned clusters. Refine
                  search if needed.
                </p>
              )}
              {selectedIds.size > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedIds.size} cluster{selectedIds.size !== 1 ? "s" : ""} selected
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
                : `Assign${selectedIds.size > 0 ? ` ${selectedIds.size}` : ""} cluster${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => { if (!o) setPendingRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove cluster</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              <span className="font-semibold text-foreground">{pendingRemove?.name}</span> from this
              federation? The cluster will remain in the system but will no longer be linked here.
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

export function FederationDetailDialog({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(id);

  useEffect(() => {
    if (open && id) setActiveId(id);
  }, [open, id]);

  const { data, isLoading, isError, error, refetch } = useFederationDetailQuery(activeId);
  const { data: clustersData, isLoading: clustersLoading } = useQuery({
    queryKey: ["clusters", { federationId: activeId }],
    queryFn: () => getClusters({ federationId: activeId!, pageSize: 200 }),
    enabled: !!activeId && open,
  });
  const removeMutation = useRemoveClusterFromFederationMutation();
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fed = data?.federation;
  const clusters = clustersData?.clusters ?? [];

  const confirmRemove = async () => {
    if (!pendingRemove || !activeId) return;
    const target = pendingRemove;
    setPendingRemove(null);
    setRemovingId(target.id);
    try {
      await removeMutation.mutateAsync({ federationId: activeId, clusterId: target.id });
      sileo.success({ title: "Cluster removed from federation" });
    } catch (error) {
      sileo.error({
        title: "Could not remove cluster",
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
            <DialogTitle>{fed?.name ?? "Federation details"}</DialogTitle>
            <DialogDescription>Full details for this federation.</DialogDescription>
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
            ) : fed ? (
              <>
                <dl className="grid grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_112px_minmax(0,1fr)] gap-x-3 gap-y-2.5">
                  <DetailField label="Name" value={fed.name} />
                  <DetailField label="Location" value={fed.location} />
                  <DetailField label="Status" value={<StatusBadge status={fed.status} />} />
                  <DetailField label="Manager" value={fed.managerName} />
                  <DetailField label="Description" value={fed.description} />
                </dl>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-3">
                    Clusters
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({clustersLoading ? "…" : clusters.length})
                    </span>
                  </p>
                  {clustersLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-11 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : clusters.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-1">No clusters assigned yet.</p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
                      {clusters.map((c: Cluster) => (
                        <div key={c.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-muted/40 ring-1 ring-border/40">
                          <LayersIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.woredaName}</p>
                          </div>
                          <StatusBadge status={c.status} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 size-9 text-destructive hover:text-destructive border border-transparent hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/10"
                            onClick={() => setPendingRemove({ id: c.id, name: c.name })}
                            disabled={removingId === c.id}
                            aria-label="Remove cluster from federation"
                          >
                            {removingId === c.id ? (
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
            <AlertDialogTitle>Remove cluster</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <span className="font-semibold text-foreground">{pendingRemove?.name}</span> from this federation? The cluster will remain in the system but will no longer be linked here.
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

export function FederationFormDialog({
  open,
  onOpenChange,
  editingFederation,
  name,
  description,
  location,
  status,
  setName,
  setDescription,
  setLocation,
  setStatus,
  onSubmit,
  isSubmitting,
  statusOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFederation: Federation | null;
  name: string;
  description: string;
  location: string;
  status: EntityStatus | "";
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setLocation: (value: string) => void;
  setStatus: (value: EntityStatus | "") => void;
  onSubmit: (event: FormEvent) => void;
  isSubmitting: boolean;
  statusOptions: Array<{ value: string; label: string }>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,50rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={onSubmit}>
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>{editingFederation ? "Edit federation" : "Add federation"}</DialogTitle>
            <DialogDescription>
              {editingFederation
                ? "Update federation details, then save your changes."
                : "Add a new federation to the community structure."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
              <div className="space-y-1.5">
                <Label htmlFor="federation-name">Name</Label>
                <Input
                  id="federation-name"
                  placeholder="Federation name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="federation-location">Location</Label>
                  <Input
                    id="federation-location"
                    placeholder="Region, area, or other location label"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="federation-status">Status</Label>
                  <SelectField
                    id="federation-status"
                    value={status}
                    onValueChange={(v) => setStatus(v as EntityStatus | "")}
                    options={statusOptions}
                    placeholder="Select status"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="federation-description">Description</Label>
                <textarea
                  id="federation-description"
                  className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Optional notes about this federation"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end border-t border-border/60 px-6 py-4">
            <SaveButton
              isPending={isSubmitting}
              idleLabel={editingFederation ? "Save federation" : "Add federation"}
              pendingLabel={editingFederation ? "Saving…" : "Adding…"}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FederationDeleteDialog({
  pendingDelete,
  onOpenChange,
  onConfirmDelete,
}: {
  pendingDelete: Federation | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}) {
  return (
    <AlertDialog open={!!pendingDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete federation</AlertDialogTitle>
          <AlertDialogDescription>
            Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void onConfirmDelete()}>
            Delete federation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
