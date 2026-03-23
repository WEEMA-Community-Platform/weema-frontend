"use client";

import { FormEvent, useMemo, useState } from "react";
import { LayersIcon, LinkIcon, NetworkIcon, UserIcon, UsersIcon, XIcon } from "lucide-react";
import { sileo } from "sileo";
import { useQuery } from "@tanstack/react-query";

import {
  useAddSHGsToClusterMutation,
  useClusterDetailQuery,
  useClustersQuery,
  useCreateClusterMutation,
  useDeleteClusterMutation,
  useFederationsQuery,
  useRemoveSHGFromClusterMutation,
  useUpdateClusterMutation,
} from "@/hooks/use-community";
import { useCurrentUser } from "@/hooks/use-user";
import { useWoredasQuery } from "@/hooks/use-base-data";
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
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
  StatusBadge,
} from "@/components/community/community-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataToolbar,
  PaginationRow,
  SaveButton,
  inputClass,
} from "@/components/base-data/shared";
import { SelectField, filterQueryParam } from "@/components/base-data/select-field";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

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

function AssignSHGsDialog({
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

  const { data: allSHGsData, isLoading } = useQuery({
    queryKey: ["shgs", { assignModal: true }],
    queryFn: () => getSHGs({ pageSize: 200 }),
    enabled: open,
  });

  const addMutation = useAddSHGsToClusterMutation();
  const allSHGs = allSHGsData?.selfHelpGroups ?? [];
  const assignable = allSHGs.filter((s) => s.clusterId !== cluster?.id);
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
    onClose();
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign self-help groups</DialogTitle>
          <DialogDescription>
            Add self-help groups to <span className="font-medium text-foreground">{cluster?.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2 space-y-3">
          <Input
            placeholder="Search self-help groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                {search ? "No self-help groups match your search." : "No available self-help groups to assign."}
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
                      {s.clusterName ? ` · Currently in ${s.clusterName}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </label>
              ))
            )}
          </div>
          {allSHGsData && allSHGs.length < allSHGsData.totalElements && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Showing {allSHGs.length} of {allSHGsData.totalElements} SHGs. Search above to find more.
            </p>
          )}
          {selectedIds.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedIds.size} SHG{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
          )}
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
  );
}

function ClusterDetailDialog({ id, open, onClose }: { id: string | null; open: boolean; onClose: () => void }) {
  const { data, isLoading, isError, error, refetch } = useClusterDetailQuery(id);
  const { data: shgsData, isLoading: shgsLoading } = useQuery({
    queryKey: ["shgs", { clusterId: id }],
    queryFn: () => getSHGs({ clusterId: id!, pageSize: 200 }),
    enabled: !!id && open,
  });
  const removeMutation = useRemoveSHGFromClusterMutation();
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const cluster = data?.cluster;
  const shgs = shgsData?.selfHelpGroups ?? [];

  const confirmRemove = async () => {
    if (!pendingRemove || !id) return;
    const target = pendingRemove;
    setPendingRemove(null);
    setRemovingId(target.id);
    try {
      await removeMutation.mutateAsync({ clusterId: id, shgId: target.id });
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
        <DialogContent className="sm:max-w-lg">
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
                <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3.5">
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
                          <button
                            className="shrink-0 rounded p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setPendingRemove({ id: s.id, name: s.name })}
                            aria-label={`Remove ${s.name}`}
                            disabled={removingId === s.id}
                          >
                            {removingId === s.id
                              ? <span className="size-3.5 block animate-spin rounded-full border-2 border-current border-t-transparent" />
                              : <XIcon className="size-3.5" />}
                          </button>
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
              Remove SHG
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ClusterManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWoredaId, setFilterWoredaId] = useState("");
  const [filterFederationId, setFilterFederationId] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [woredaId, setWoredaId] = useState("");
  const [federationId, setFederationId] = useState(""); // preserved on edit, not shown in form
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Cluster | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [assigningCluster, setAssigningCluster] = useState<Cluster | null>(null);

  const clustersQuery = useClustersQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(filterStatus) as EntityStatus | undefined,
    woredaId: filterQueryParam(filterWoredaId),
    federationId: filterQueryParam(filterFederationId),
    location: filterLocation.trim() || undefined,
  });
  const { data: currentUserData } = useCurrentUser();
  const { data: woredaData } = useWoredasQuery({ page: 1, pageSize: 200, searchQuery: "" });
  const { data: federationsData } = useFederationsQuery({ page: 1, pageSize: 200 });

  const createMutation = useCreateClusterMutation();
  const updateMutation = useUpdateClusterMutation();
  const deleteMutation = useDeleteClusterMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const woredaOptions = (woredaData?.woredas ?? []).map((w: { id: string; name: string }) => ({ value: w.id, label: w.name }));

  const federationFilterOptions = useMemo(
    () =>
      (federationsData?.federations ?? []).map((f) => ({ value: f.id, label: f.name })),
    [federationsData?.federations]
  );
  const woredaFilterOptions = useMemo(
    () =>
      (woredaData?.woredas ?? []).map((w) => ({ value: w.id, label: w.name })),
    [woredaData?.woredas]
  );

  const resetForm = () => { setName(""); setDescription(""); setStatus("ACTIVE"); setWoredaId(""); setFederationId(""); setEditingCluster(null); };
  const openCreate = () => { resetForm(); setIsFormOpen(true); };
  const openEdit = (c: Cluster) => {
    setEditingCluster(c);
    setName(c.name);
    setDescription(c.description || "");
    setStatus(c.status);
    setWoredaId(c.woredaId || "");
    setFederationId(c.federationId || ""); // preserve existing assignment silently
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { sileo.warning({ title: "Missing name", description: "Cluster name is required." }); return; }
    if (!woredaId) { sileo.warning({ title: "Missing woreda", description: "Please select a woreda for this cluster." }); return; }
    const managerId = currentUserData?.user?.id;
    const resolvedFederationId = federationId && federationId !== "none" ? federationId : undefined;
    try {
      if (editingCluster) {
        const result = await updateMutation.mutateAsync({ id: editingCluster.id, payload: { name: name.trim(), description: description.trim(), status, woredaId, federationId: resolvedFederationId, ...(managerId ? { managerId } : {}) } });
        sileo.success({ title: "Cluster updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({ name: name.trim(), description: description.trim(), status, woredaId, ...(managerId ? { managerId } : {}) });
        sileo.success({ title: "Cluster added", description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: "Could not save cluster", description: error instanceof Error ? error.message : "Unexpected error" });
    }
  };

  const clusters = clustersQuery.data?.clusters ?? [];

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder="Search clusters"
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onAdd={openCreate}
        addLabel="Add cluster"
        showFilterButton
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={Boolean(
          filterStatus ||
            filterWoredaId ||
            filterFederationId ||
            filterLocation.trim()
        )}
      />

      {clustersQuery.isLoading ? (
        <CommunityCardSkeleton rowCount={3} />
      ) : clustersQuery.isError ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {clustersQuery.error instanceof Error ? clustersQuery.error.message : "Failed to load clusters."}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => clustersQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : clusters.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No clusters found. Add your first cluster to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {clusters.map((c) => (
            <CommunityCard
              key={c.id}
              title={c.name}
              status={c.status}
              onView={() => setViewingId(c.id)}
              onEdit={() => openEdit(c)}
              onDelete={() => setPendingDelete(c)}
              extraMenuItems={
                <DropdownMenuItem className="text-[12px]" onClick={() => setAssigningCluster(c)}>
                  <LinkIcon />Assign SHGs
                </DropdownMenuItem>
              }
            >
              <CardMetaRow icon={NetworkIcon} label="Federation">
                {c.federationName ?? "No federation"}
              </CardMetaRow>
              <CardMetaRow icon={UserIcon} label="Manager">
                {c.managerName ?? "No manager"}
              </CardMetaRow>
              <CardMetaRow icon={LayersIcon} label="SHGs">
                {c.selfHelpGroupCount} {c.selfHelpGroupCount === 1 ? "SHG" : "SHGs"}
              </CardMetaRow>
            </CommunityCard>
          ))}
        </div>
      )}

      {clustersQuery.data && clustersQuery.data.totalPages > 1 && (
        <PaginationRow
          currentPage={clustersQuery.data.currentPage}
          totalPages={clustersQuery.data.totalPages}
          totalElements={clustersQuery.data.totalElements}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(clustersQuery.data?.totalPages ?? p, p + 1))}
        />
      )}

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter clusters</DialogTitle>
            <DialogDescription>Filter by status, woreda, federation, or location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <SelectField
              value={filterStatus}
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              onValueChange={(v) => {
                setFilterStatus(v);
                setPage(1);
              }}
            />
            <SelectField
              value={filterWoredaId}
              placeholder="All woredas"
              options={woredaFilterOptions}
              onValueChange={(v) => {
                setFilterWoredaId(v);
                setPage(1);
              }}
            />
            <SelectField
              value={filterFederationId}
              placeholder="All federations"
              options={federationFilterOptions}
              onValueChange={(v) => {
                setFilterFederationId(v);
                setPage(1);
              }}
            />
            <Input
              placeholder="Location contains"
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setFilterStatus("");
                setFilterWoredaId("");
                setFilterFederationId("");
                setFilterLocation("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
            <Button
              type="button"
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsFilterOpen(false)}
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingCluster ? "Edit cluster" : "Add cluster"}</DialogTitle>
              <DialogDescription>{editingCluster ? "Update cluster details, then save your changes." : "Add a new cluster to the community structure."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Cluster name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <SelectField value={woredaId} onValueChange={setWoredaId} options={woredaOptions} placeholder="Select woreda" className="h-11" />
              <SelectField value={status} onValueChange={(v) => setStatus(v as EntityStatus)} options={STATUS_OPTIONS} placeholder="Status" className="h-11" />
              <textarea className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <SaveButton isPending={isSubmitting} idleLabel={editingCluster ? "Save cluster" : "Add cluster"} pendingLabel={editingCluster ? "Saving…" : "Adding…"} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClusterDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />

      <AssignSHGsDialog
        cluster={assigningCluster}
        open={!!assigningCluster}
        onClose={() => setAssigningCluster(null)}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete cluster</AlertDialogTitle>
            <AlertDialogDescription>Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={async () => {
              if (!pendingDelete) return;
              try { const result = await deleteMutation.mutateAsync(pendingDelete.id); sileo.success({ title: "Cluster deleted", description: result.message }); setPendingDelete(null); }
              catch (error) { sileo.error({ title: "Could not delete cluster", description: error instanceof Error ? error.message : "Unexpected error" }); }
            }}>Delete cluster</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
