"use client";

import { FormEvent, useMemo, useState } from "react";
import { LayersIcon, MapPinIcon, UsersIcon, UserIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useClustersQuery,
  useCreateSHGMutation,
  useDeleteSHGMutation,
  useSHGDetailQuery,
  useSHGsQuery,
  useUpdateSHGMutation,
} from "@/hooks/use-community";
import { useKebelesQuery, useWoredasQuery } from "@/hooks/use-base-data";
import type { EntityStatus, SHG } from "@/lib/api/community";
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

function SHGDetailDialog({ id, open, onClose }: { id: string | null; open: boolean; onClose: () => void }) {
  const { data, isLoading, isError, error, refetch } = useSHGDetailQuery(id);
  const shg = data?.selfHelpGroup;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shg?.name ?? "Self-Help Group details"}</DialogTitle>
          <DialogDescription>Full details for this self-help group.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Could not load details."}
              </p>
              <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-primary hover:underline">
                Retry
              </button>
            </div>
          ) : shg ? (
            <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3.5">
              <DetailField label="Name" value={shg.name} />
              <DetailField label="Status" value={<StatusBadge status={shg.status} />} />
              <DetailField label="Cluster" value={shg.clusterName} />
              <DetailField label="Woreda" value={shg.woredaName} />
              <DetailField label="Kebele" value={shg.kebeleName} />
              <DetailField label="Facilitator" value={shg.facilitatorName} />
              <DetailField label="Members" value={shg.memberCount} />
              <DetailField label="GPS" value={shg.latitude != null && shg.longitude != null ? `${shg.latitude}, ${shg.longitude}` : null} />
              <DetailField label="Description" value={shg.description} />
            </dl>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SHGManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [woredaId, setWoredaId] = useState("");
  const [kebeleId, setKebeleId] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [editingSHG, setEditingSHG] = useState<SHG | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SHG | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWoredaId, setFilterWoredaId] = useState("");
  const [filterKebeleId, setFilterKebeleId] = useState("");
  const [filterClusterId, setFilterClusterId] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const shgsQuery = useSHGsQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(filterStatus) as EntityStatus | undefined,
    woredaId: filterQueryParam(filterWoredaId),
    kebeleId: filterQueryParam(filterKebeleId),
    clusterId: filterQueryParam(filterClusterId),
    location: filterLocation.trim() || undefined,
  });
  const { data: woredaData } = useWoredasQuery({ page: 1, pageSize: 200, searchQuery: "" });
  const { data: kebeleData } = useKebelesQuery({ page: 1, pageSize: 200, searchQuery: "" });
  const { data: kebeleFilterData } = useKebelesQuery({
    page: 1,
    pageSize: 200,
    searchQuery: "",
    woredaId: filterQueryParam(filterWoredaId),
  });
  const { data: clustersData } = useClustersQuery({ page: 1, pageSize: 200 });

  const createMutation = useCreateSHGMutation();
  const updateMutation = useUpdateSHGMutation();
  const deleteMutation = useDeleteSHGMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const woredaOptions = [
    { value: "none", label: "No woreda" },
    ...(woredaData?.woredas ?? []).map((w: { id: string; name: string }) => ({ value: w.id, label: w.name })),
  ];
  const kebeleOptions = [
    { value: "none", label: "No kebele" },
    ...(kebeleData?.kebeles ?? []).map((k: { id: string; name: string }) => ({ value: k.id, label: k.name })),
  ];

  const woredaFilterOptions = useMemo(
    () =>
      (woredaData?.woredas ?? []).map((w) => ({ value: w.id, label: w.name })),
    [woredaData?.woredas]
  );
  const kebeleFilterOptions = useMemo(
    () =>
      (kebeleFilterData?.kebeles ?? []).map((k) => ({ value: k.id, label: k.name })),
    [kebeleFilterData?.kebeles]
  );
  const clusterFilterOptions = useMemo(
    () =>
      (clustersData?.clusters ?? []).map((c) => ({ value: c.id, label: c.name })),
    [clustersData?.clusters]
  );
  const resetForm = () => { setName(""); setDescription(""); setStatus("ACTIVE"); setWoredaId(""); setKebeleId(""); setClusterId(""); setLatitude(""); setLongitude(""); setEditingSHG(null); };
  const openCreate = () => { resetForm(); setIsFormOpen(true); };
  const openEdit = (s: SHG) => {
    setEditingSHG(s); setName(s.name); setDescription(s.description || ""); setStatus(s.status);
    setWoredaId(s.woredaId || ""); setKebeleId(s.kebeleId || ""); setClusterId(s.clusterId || "");
    setLatitude(s.latitude?.toString() || ""); setLongitude(s.longitude?.toString() || "");
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { sileo.warning({ title: "Missing name", description: "SHG name is required." }); return; }
    const resolvedWoredaId = woredaId && woredaId !== "none" ? woredaId : undefined;
    const resolvedKebeleId = kebeleId && kebeleId !== "none" ? kebeleId : undefined;
    const resolvedClusterId = clusterId && clusterId !== "none" ? clusterId : undefined;
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    try {
      if (editingSHG) {
        const result = await updateMutation.mutateAsync({ id: editingSHG.id, payload: { name: name.trim(), description: description.trim(), status, woredaId: resolvedWoredaId, kebeleId: resolvedKebeleId, clusterId: resolvedClusterId, latitude: lat, longitude: lng } });
        sileo.success({ title: "SHG updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({ name: name.trim(), description: description.trim(), status, woredaId: resolvedWoredaId, kebeleId: resolvedKebeleId, clusterId: resolvedClusterId, latitude: lat, longitude: lng });
        sileo.success({ title: "SHG added", description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: "Could not save SHG", description: error instanceof Error ? error.message : "Unexpected error" });
    }
  };

  const shgs = shgsQuery.data?.selfHelpGroups ?? [];

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder="Search self-help groups"
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onAdd={openCreate}
        addLabel="Add SHG"
        showFilterButton
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={Boolean(
          filterStatus ||
            filterWoredaId ||
            filterKebeleId ||
            filterClusterId ||
            filterLocation.trim()
        )}
      />

      {shgsQuery.isLoading ? (
        <CommunityCardSkeleton rowCount={4} />
      ) : shgsQuery.isError ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {shgsQuery.error instanceof Error ? shgsQuery.error.message : "Failed to load self-help groups."}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => shgsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : shgs.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No self-help groups found. Add your first SHG to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {shgs.map((s: SHG) => {
            const hasGps = s.latitude != null && s.longitude != null;
            return (
              <CommunityCard
                key={s.id}
                title={s.name}
                status={s.status}
                onView={() => setViewingId(s.id)}
                onEdit={() => openEdit(s)}
                onDelete={() => setPendingDelete(s)}
              >
                <CardMetaRow icon={LayersIcon} label="Cluster">
                  {s.clusterName ?? "No cluster"}
                </CardMetaRow>
                <CardMetaRow icon={UserIcon} label="Facilitator">
                  {s.facilitatorName ?? "No facilitator"}
                </CardMetaRow>
                <CardMetaRow icon={UsersIcon} label="Members">
                  {s.memberCount ?? 0} {s.memberCount === 1 ? "member" : "members"}
                </CardMetaRow>
                <CardMetaRow icon={MapPinIcon} label="GPS">
                  {hasGps ? `${s.latitude}, ${s.longitude}` : "No coordinates"}
                </CardMetaRow>
              </CommunityCard>
            );
          })}
        </div>
      )}

      {shgsQuery.data && shgsQuery.data.totalPages > 1 && (
        <PaginationRow
          currentPage={shgsQuery.data.currentPage}
          totalPages={shgsQuery.data.totalPages}
          totalElements={shgsQuery.data.totalElements}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(shgsQuery.data?.totalPages ?? p, p + 1))}
        />
      )}

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter self-help groups</DialogTitle>
            <DialogDescription>Filter by status, geography, cluster, or location.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto px-5 pb-4">
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
                setFilterKebeleId("");
                setPage(1);
              }}
            />
            <SelectField
              value={filterKebeleId}
              placeholder="All kebeles"
              options={kebeleFilterOptions}
              onValueChange={(v) => {
                setFilterKebeleId(v);
                setPage(1);
              }}
            />
            <SelectField
              value={filterClusterId}
              placeholder="All clusters"
              options={clusterFilterOptions}
              onValueChange={(v) => {
                setFilterClusterId(v);
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
                setFilterKebeleId("");
                setFilterClusterId("");
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
              <DialogTitle>{editingSHG ? "Edit self-help group" : "Add self-help group"}</DialogTitle>
              <DialogDescription>{editingSHG ? "Update SHG details, then save your changes." : "Add a new self-help group to the community structure."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="SHG name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <SelectField value={woredaId || "none"} onValueChange={setWoredaId} options={woredaOptions} placeholder="Select woreda (optional)" className="h-11" />
              <SelectField value={kebeleId || "none"} onValueChange={setKebeleId} options={kebeleOptions} placeholder="Select kebele (optional)" className="h-11" />
              <SelectField value={status} onValueChange={(v) => setStatus(v as EntityStatus)} options={STATUS_OPTIONS} placeholder="Status" className="h-11" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputClass} />
                <Input placeholder="Longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputClass} />
              </div>
              <textarea className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <SaveButton isPending={isSubmitting} idleLabel={editingSHG ? "Save SHG" : "Add SHG"} pendingLabel={editingSHG ? "Saving..." : "Adding..."} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SHGDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete self-help group</AlertDialogTitle>
            <AlertDialogDescription>Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={async () => {
              if (!pendingDelete) return;
              try { const result = await deleteMutation.mutateAsync(pendingDelete.id); sileo.success({ title: "SHG deleted", description: result.message }); setPendingDelete(null); }
              catch (error) { sileo.error({ title: "Could not delete SHG", description: error instanceof Error ? error.message : "Unexpected error" }); }
            }}>Delete SHG</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
