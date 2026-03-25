"use client";

import { FormEvent, useMemo, useState } from "react";
import { LayersIcon, LinkIcon, NetworkIcon, UserIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useClustersQuery,
  useCreateClusterMutation,
  useDeleteClusterMutation,
  useFederationsQuery,
  useUpdateClusterMutation,
} from "@/hooks/use-community";
import { useCurrentUser } from "@/hooks/use-user";
import { useWoredasQuery } from "@/hooks/use-base-data";
import type { Cluster, EntityStatus } from "@/lib/api/community";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
} from "@/components/community/community-card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataToolbar,
  PaginationRow,
  inputClass,
  listEmptyMessage,
} from "@/components/base-data/shared";
import { SelectField, filterQueryParam } from "@/components/base-data/select-field";
import {
  AssignSHGsDialog,
  ClusterDeleteDialog,
  ClusterDetailDialog,
  ClusterFormDialog,
} from "@/components/community/cluster-manager-dialogs";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];


export function ClusterManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [appliedFilterStatus, setAppliedFilterStatus] = useState("");
  const [appliedFilterWoredaId, setAppliedFilterWoredaId] = useState("");
  const [appliedFilterFederationId, setAppliedFilterFederationId] = useState("");
  const [appliedFilterLocation, setAppliedFilterLocation] = useState("");
  const [draftFilterStatus, setDraftFilterStatus] = useState("");
  const [draftFilterWoredaId, setDraftFilterWoredaId] = useState("");
  const [draftFilterFederationId, setDraftFilterFederationId] = useState("");
  const [draftFilterLocation, setDraftFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EntityStatus | "">("");
  const [woredaId, setWoredaId] = useState("");
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Cluster | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [assigningCluster, setAssigningCluster] = useState<Cluster | null>(null);

  const clustersQuery = useClustersQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(appliedFilterStatus) as EntityStatus | undefined,
    woredaId: filterQueryParam(appliedFilterWoredaId),
    federationId: filterQueryParam(appliedFilterFederationId),
    location: appliedFilterLocation.trim() || undefined,
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

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("");
    setWoredaId("");
    setEditingCluster(null);
  };
  const openCreate = () => { resetForm(); setIsFormOpen(true); };
  const openEdit = (c: Cluster) => {
    setEditingCluster(c);
    setName(c.name);
    setDescription(c.description || "");
    setStatus(c.status);
    setWoredaId(c.woredaId || "");
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { sileo.warning({ title: "Missing name", description: "Cluster name is required." }); return; }
    if (!woredaId) { sileo.warning({ title: "Missing woreda", description: "Please select a woreda for this cluster." }); return; }
    if (!status) { sileo.warning({ title: "Missing status", description: "Please select a status." }); return; }
    const managerId = currentUserData?.user?.id;
    try {
      if (editingCluster) {
        const result = await updateMutation.mutateAsync({
          id: editingCluster.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            status,
            woredaId,
            ...(managerId ? { managerId } : {}),
          },
        });
        sileo.success({ title: "Cluster updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          status,
          woredaId,
          ...(managerId ? { managerId } : {}),
        });
        sileo.success({ title: "Cluster added", description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: "Could not save cluster", description: error instanceof Error ? error.message : "Unexpected error" });
    }
  };

  const clusters = clustersQuery.data?.clusters ?? [];
  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(
    appliedFilterStatus ||
      appliedFilterWoredaId ||
      appliedFilterFederationId ||
      appliedFilterLocation.trim()
  );
  const emptyMessage = listEmptyMessage({
    entityPlural: "clusters",
    hasSearch,
    hasFilters,
    emptyCatalogHint: "No clusters yet. Add your first cluster to get started.",
  });

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
        hasActiveFilters={hasFilters}
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
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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

      <Dialog
        open={isFilterOpen}
        onOpenChange={(open) => {
          setIsFilterOpen(open);
          if (open) {
            setDraftFilterStatus(appliedFilterStatus);
            setDraftFilterWoredaId(appliedFilterWoredaId);
            setDraftFilterFederationId(appliedFilterFederationId);
            setDraftFilterLocation(appliedFilterLocation);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter clusters</DialogTitle>
            <DialogDescription>Filter by status, woreda, federation, or location. Changes apply when you click Apply filters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <SelectField
              value={draftFilterStatus}
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              onValueChange={setDraftFilterStatus}
            />
            <SelectField
              value={draftFilterWoredaId}
              placeholder="All woredas"
              options={woredaFilterOptions}
              onValueChange={setDraftFilterWoredaId}
            />
            <SelectField
              value={draftFilterFederationId}
              placeholder="All federations"
              options={federationFilterOptions}
              onValueChange={setDraftFilterFederationId}
            />
            <Input
              placeholder="Location contains"
              value={draftFilterLocation}
              onChange={(e) => setDraftFilterLocation(e.target.value)}
              className={inputClass}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setAppliedFilterStatus("");
                setAppliedFilterWoredaId("");
                setAppliedFilterFederationId("");
                setAppliedFilterLocation("");
                setDraftFilterStatus("");
                setDraftFilterWoredaId("");
                setDraftFilterFederationId("");
                setDraftFilterLocation("");
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              Clear filters
            </Button>
            <Button
              type="button"
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setAppliedFilterStatus(draftFilterStatus);
                setAppliedFilterWoredaId(draftFilterWoredaId);
                setAppliedFilterFederationId(draftFilterFederationId);
                setAppliedFilterLocation(draftFilterLocation);
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClusterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingCluster={editingCluster}
        name={name}
        description={description}
        status={status}
        woredaId={woredaId}
        woredaOptions={woredaOptions}
        statusOptions={STATUS_OPTIONS}
        setName={setName}
        setDescription={setDescription}
        setStatus={setStatus}
        setWoredaId={setWoredaId}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
      />

      <ClusterDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />

      <AssignSHGsDialog
        cluster={assigningCluster}
        open={!!assigningCluster}
        onClose={() => setAssigningCluster(null)}
      />

      <ClusterDeleteDialog
        pendingDelete={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirmDelete={async () => {
          if (!pendingDelete) return;
          try {
            const result = await deleteMutation.mutateAsync(pendingDelete.id);
            sileo.success({ title: "Cluster deleted", description: result.message });
            setPendingDelete(null);
          } catch (error) {
            sileo.error({
              title: "Could not delete cluster",
              description: error instanceof Error ? error.message : "Unexpected error",
            });
          }
        }}
      />
    </div>
  );
}
