"use client";

import { FormEvent, useState } from "react";
import { LayersIcon, LinkIcon, UserIcon, XIcon } from "lucide-react";
import { sileo } from "sileo";
import { useQuery } from "@tanstack/react-query";

import {
  useAddClustersToFederationMutation,
  useCreateFederationMutation,
  useDeleteFederationMutation,
  useFederationDetailQuery,
  useFederationsQuery,
  useRemoveClusterFromFederationMutation,
  useUpdateFederationMutation,
} from "@/hooks/use-community";
import { useCurrentUser } from "@/hooks/use-user";
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

function AssignClustersDialog({
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

  const { data: allClustersData, isLoading } = useQuery({
    queryKey: ["clusters", { assignModal: true }],
    queryFn: () => getClusters({ pageSize: 200 }),
    enabled: open,
  });

  const addMutation = useAddClustersToFederationMutation();
  const allClusters = allClustersData?.clusters ?? [];
  const assignable = allClusters.filter((c) => c.federationId !== federation?.id);
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
    onClose();
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign clusters</DialogTitle>
          <DialogDescription>
            Add clusters to <span className="font-medium text-foreground">{federation?.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2 space-y-3">
          <Input
            placeholder="Search clusters…"
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
                {search ? "No clusters match your search." : "No available clusters to assign."}
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
                    <p className="text-xs text-muted-foreground truncate">
                      {c.woredaName}
                      {c.federationName ? ` · Currently in ${c.federationName}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </label>
              ))
            )}
          </div>
          {allClustersData && allClusters.length < allClustersData.totalElements && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Showing {allClusters.length} of {allClustersData.totalElements} clusters. Search above to find more.
            </p>
          )}
          {selectedIds.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedIds.size} cluster{selectedIds.size !== 1 ? "s" : ""} selected
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
              : `Assign${selectedIds.size > 0 ? ` ${selectedIds.size}` : ""} cluster${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FederationDetailDialog({ id, open, onClose }: { id: string | null; open: boolean; onClose: () => void }) {
  const { data, isLoading, isError, error, refetch } = useFederationDetailQuery(id);
  const { data: clustersData, isLoading: clustersLoading } = useQuery({
    queryKey: ["clusters", { federationId: id }],
    queryFn: () => getClusters({ federationId: id!, pageSize: 200 }),
    enabled: !!id && open,
  });
  const removeMutation = useRemoveClusterFromFederationMutation();
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fed = data?.federation;
  const clusters = clustersData?.clusters ?? [];

  const confirmRemove = async () => {
    if (!pendingRemove || !id) return;
    const target = pendingRemove;
    setPendingRemove(null);
    setRemovingId(target.id);
    try {
      await removeMutation.mutateAsync({ federationId: id, clusterId: target.id });
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
        <DialogContent className="sm:max-w-lg">
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
                <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3.5">
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
                          <button
                            className="shrink-0 rounded p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setPendingRemove({ id: c.id, name: c.name })}
                            aria-label={`Remove ${c.name}`}
                            disabled={removingId === c.id}
                          >
                            {removingId === c.id
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
            <AlertDialogTitle>Remove cluster</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <span className="font-semibold text-foreground">{pendingRemove?.name}</span> from this federation? The cluster will remain in the system but will no longer be linked here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              Remove cluster
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function FederationManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [editingFederation, setEditingFederation] = useState<Federation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Federation | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [assigningFederation, setAssigningFederation] = useState<Federation | null>(null);

  const federationsQuery = useFederationsQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(filterStatus) as EntityStatus | undefined,
    location: filterLocation.trim() || undefined,
  });

  const { data: currentUserData } = useCurrentUser();
  const createMutation = useCreateFederationMutation();
  const updateMutation = useUpdateFederationMutation();
  const deleteMutation = useDeleteFederationMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => { setName(""); setDescription(""); setLocation(""); setStatus("ACTIVE"); setEditingFederation(null); };
  const openCreate = () => { resetForm(); setIsFormOpen(true); };
  const openEdit = (f: Federation) => { setEditingFederation(f); setName(f.name); setDescription(f.description || ""); setLocation(f.location || ""); setStatus(f.status); setIsFormOpen(true); };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { sileo.warning({ title: "Missing name", description: "Federation name is required." }); return; }
    const managerId = currentUserData?.user?.id;
    try {
      if (editingFederation) {
        const result = await updateMutation.mutateAsync({ id: editingFederation.id, payload: { name: name.trim(), description: description.trim(), location: location.trim(), status, ...(managerId ? { managerId } : {}) } });
        sileo.success({ title: "Federation updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({ name: name.trim(), description: description.trim(), location: location.trim(), status, ...(managerId ? { managerId } : {}) });
        sileo.success({ title: "Federation added", description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: "Could not save federation", description: error instanceof Error ? error.message : "Unexpected error" });
    }
  };

  const federations = federationsQuery.data?.federations ?? [];

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder="Search federations"
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onAdd={openCreate}
        addLabel="Add federation"
        showFilterButton
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={Boolean(filterStatus || filterLocation.trim())}
      />

      {federationsQuery.isLoading ? (
        <CommunityCardSkeleton rowCount={2} />
      ) : federationsQuery.isError ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {federationsQuery.error instanceof Error ? federationsQuery.error.message : "Failed to load federations."}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => federationsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : federations.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No federations found. Add your first federation to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {federations.map((f) => (
            <CommunityCard
              key={f.id}
              title={f.name}
              status={f.status}
              onView={() => setViewingId(f.id)}
              onEdit={() => openEdit(f)}
              onDelete={() => setPendingDelete(f)}
              extraMenuItems={
                <DropdownMenuItem className="text-[12px]" onClick={() => setAssigningFederation(f)}>
                  <LinkIcon />Assign clusters
                </DropdownMenuItem>
              }
            >
              <CardMetaRow icon={UserIcon} label="Manager">
                {f.managerName ?? "No manager"}
              </CardMetaRow>
              <CardMetaRow icon={LayersIcon} label="Clusters">
                {f.clusterCount} {f.clusterCount === 1 ? "cluster" : "clusters"}
              </CardMetaRow>
            </CommunityCard>
          ))}
        </div>
      )}

      {federationsQuery.data && federationsQuery.data.totalPages > 1 && (
        <PaginationRow
          currentPage={federationsQuery.data.currentPage}
          totalPages={federationsQuery.data.totalPages}
          totalElements={federationsQuery.data.totalElements}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(federationsQuery.data?.totalPages ?? p, p + 1))}
        />
      )}

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter federations</DialogTitle>
            <DialogDescription>Filter by status, location, or both.</DialogDescription>
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
              <DialogTitle>{editingFederation ? "Edit federation" : "Add federation"}</DialogTitle>
              <DialogDescription>{editingFederation ? "Update federation details, then save your changes." : "Add a new federation to the community structure."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Federation name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
              <SelectField value={status} onValueChange={(v) => setStatus(v as EntityStatus)} options={STATUS_OPTIONS} placeholder="Status" className="h-11" />
              <textarea className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <SaveButton isPending={isSubmitting} idleLabel={editingFederation ? "Save federation" : "Add federation"} pendingLabel={editingFederation ? "Saving…" : "Adding…"} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FederationDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />

      <AssignClustersDialog
        federation={assigningFederation}
        open={!!assigningFederation}
        onClose={() => setAssigningFederation(null)}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete federation</AlertDialogTitle>
            <AlertDialogDescription>Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={async () => {
              if (!pendingDelete) return;
              try { const result = await deleteMutation.mutateAsync(pendingDelete.id); sileo.success({ title: "Federation deleted", description: result.message }); setPendingDelete(null); }
              catch (error) { sileo.error({ title: "Could not delete federation", description: error instanceof Error ? error.message : "Unexpected error" }); }
            }}>Delete federation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
