"use client";

import { type ClipboardEvent, FormEvent, useMemo, useState } from "react";
import { LayersIcon, MapPinIcon, UsersIcon, UserIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useClustersQuery,
  useCreateSHGMutation,
  useDeleteSHGMutation,
  useSHGsQuery,
  useUpdateSHGMutation,
} from "@/hooks/use-community";
import { useKebelesQuery, useWoredasQuery } from "@/hooks/use-base-data";
import type { EntityStatus, SHG } from "@/lib/api/community";
import { extractLatLngFromMapsUrl } from "@/lib/maps-coordinates";
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
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
import {
  DataToolbar,
  PaginationRow,
  inputClass,
  listEmptyMessage,
} from "@/components/base-data/shared";
import { SelectField, filterQueryParam } from "@/components/base-data/select-field";
import {
  SHGDeleteDialog,
  SHGDetailDialog,
  SHGFormDialog,
} from "@/components/community/shg-manager-dialogs";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];


export function SHGManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EntityStatus | "">("");
  const [woredaId, setWoredaId] = useState("none");
  const [kebeleId, setKebeleId] = useState("none");
  /** Edit form only — new SHGs are created without a cluster; assign via Edit SHG. */
  const [clusterId, setClusterId] = useState("none");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  /** Helper field — not submitted; used to paste maps links and fill lat/lng. */
  const [mapsUrl, setMapsUrl] = useState("");
  /**
   * idle: user can paste a map link or type coordinates.
   * map: coordinates came from a parsed link — lat/lng read-only.
   * manual: user is typing coordinates — map link field disabled until they switch back.
   */
  const [coordinateMode, setCoordinateMode] = useState<"idle" | "map" | "manual">("idle");
  const [editingSHG, setEditingSHG] = useState<SHG | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SHG | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [appliedFilterStatus, setAppliedFilterStatus] = useState("");
  const [appliedFilterWoredaId, setAppliedFilterWoredaId] = useState("");
  const [appliedFilterKebeleId, setAppliedFilterKebeleId] = useState("");
  const [appliedFilterClusterId, setAppliedFilterClusterId] = useState("");
  const [appliedFilterLocation, setAppliedFilterLocation] = useState("");
  const [draftFilterStatus, setDraftFilterStatus] = useState("");
  const [draftFilterWoredaId, setDraftFilterWoredaId] = useState("");
  const [draftFilterKebeleId, setDraftFilterKebeleId] = useState("");
  const [draftFilterClusterId, setDraftFilterClusterId] = useState("");
  const [draftFilterLocation, setDraftFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const shgsQuery = useSHGsQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(appliedFilterStatus) as EntityStatus | undefined,
    woredaId: filterQueryParam(appliedFilterWoredaId),
    kebeleId: filterQueryParam(appliedFilterKebeleId),
    clusterId: filterQueryParam(appliedFilterClusterId),
    location: appliedFilterLocation.trim() || undefined,
  });
  const { data: woredaData } = useWoredasQuery({ page: 1, pageSize: 200, searchQuery: "" });
  const { data: kebeleData } = useKebelesQuery({ page: 1, pageSize: 200, searchQuery: "" });
  const { data: kebeleFilterData } = useKebelesQuery({
    page: 1,
    pageSize: 200,
    searchQuery: "",
    woredaId: filterQueryParam(draftFilterWoredaId),
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
  const clusterFormOptions = useMemo(
    () => [
      { value: "none", label: "No cluster (unassigned)" },
      ...(clustersData?.clusters ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [clustersData?.clusters]
  );
  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("");
    setWoredaId("none");
    setKebeleId("none");
    setClusterId("none");
    setLatitude("");
    setLongitude("");
    setMapsUrl("");
    setCoordinateMode("idle");
    setEditingSHG(null);
  };
  const openCreate = () => { resetForm(); setIsFormOpen(true); };
  const openEdit = (s: SHG) => {
    setEditingSHG(s);
    setName(s.name);
    setDescription(s.description || "");
    setStatus(s.status);
    setWoredaId(s.woredaId || "none");
    setKebeleId(s.kebeleId || "none");
    setClusterId(s.clusterId || "none");
    const latStr = s.latitude != null ? String(s.latitude) : "";
    const lngStr = s.longitude != null ? String(s.longitude) : "";
    setLatitude(latStr);
    setLongitude(lngStr);
    setMapsUrl("");
    setCoordinateMode(latStr !== "" || lngStr !== "" ? "manual" : "idle");
    setIsFormOpen(true);
  };

  const applyMapsUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    const next = extractLatLngFromMapsUrl(trimmed);
    if (next) {
      setLatitude(String(next.lat));
      setLongitude(String(next.lng));
      setCoordinateMode("map");
      return true;
    }
    return false;
  };

  const handleMapsUrlChange = (value: string) => {
    setMapsUrl(value);
    if (coordinateMode === "map" && !value.trim()) {
      setCoordinateMode("idle");
      setLatitude("");
      setLongitude("");
    }
  };

  const handleMapsUrlBlur = () => {
    if (coordinateMode === "manual") return;
    const trimmed = mapsUrl.trim();
    if (!trimmed) return;
    const ok = applyMapsUrl(trimmed);
    if (!ok && /https?:|maps\.|apple\.|goo\.|google\.com\/maps/i.test(trimmed)) {
      sileo.warning({
        title: "Could not read coordinates",
        description: "Try another link or enter latitude and longitude below.",
      });
    }
  };

  const handleMapsPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (coordinateMode === "manual") return;
    const pasted = e.clipboardData.getData("text")?.trim();
    if (!pasted) return;
    const next = extractLatLngFromMapsUrl(pasted);
    if (next) {
      e.preventDefault();
      setMapsUrl(pasted);
      setLatitude(String(next.lat));
      setLongitude(String(next.lng));
      setCoordinateMode("map");
    }
  };

  const handleManualCoordinateInput = (field: "lat" | "lng", value: string) => {
    if (coordinateMode === "idle") {
      setCoordinateMode("manual");
      setMapsUrl("");
    }
    if (field === "lat") setLatitude(value);
    else setLongitude(value);
  };

  const switchToMapLinkEntry = () => {
    setCoordinateMode("idle");
    setMapsUrl("");
    setLatitude("");
    setLongitude("");
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { sileo.warning({ title: "Missing name", description: "SHG name is required." }); return; }
    if (!status) { sileo.warning({ title: "Missing status", description: "Please select a status." }); return; }
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
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          status,
          woredaId: resolvedWoredaId,
          kebeleId: resolvedKebeleId,
          latitude: lat,
          longitude: lng,
        });
        sileo.success({ title: "SHG added", description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: "Could not save SHG", description: error instanceof Error ? error.message : "Unexpected error" });
    }
  };

  const shgs = shgsQuery.data?.selfHelpGroups ?? [];
  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(
    appliedFilterStatus ||
      appliedFilterWoredaId ||
      appliedFilterKebeleId ||
      appliedFilterClusterId ||
      appliedFilterLocation.trim()
  );
  const emptyMessage = listEmptyMessage({
    entityPlural: "self-help groups",
    hasSearch,
    hasFilters,
    emptyCatalogHint: "No self-help groups yet. Add your first SHG to get started.",
  });

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
        hasActiveFilters={hasFilters}
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
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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

      <Dialog
        open={isFilterOpen}
        onOpenChange={(open) => {
          setIsFilterOpen(open);
          if (open) {
            setDraftFilterStatus(appliedFilterStatus);
            setDraftFilterWoredaId(appliedFilterWoredaId);
            setDraftFilterKebeleId(appliedFilterKebeleId);
            setDraftFilterClusterId(appliedFilterClusterId);
            setDraftFilterLocation(appliedFilterLocation);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter self-help groups</DialogTitle>
            <DialogDescription>Filter by status, geography, cluster, or location. Changes apply when you click Apply filters.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto px-5 pb-4">
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
              onValueChange={(v) => {
                setDraftFilterWoredaId(v);
                setDraftFilterKebeleId("");
              }}
            />
            <SelectField
              value={draftFilterKebeleId}
              placeholder="All kebeles"
              options={kebeleFilterOptions}
              onValueChange={setDraftFilterKebeleId}
            />
            <SelectField
              value={draftFilterClusterId}
              placeholder="All clusters"
              options={clusterFilterOptions}
              onValueChange={setDraftFilterClusterId}
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
                setAppliedFilterKebeleId("");
                setAppliedFilterClusterId("");
                setAppliedFilterLocation("");
                setDraftFilterStatus("");
                setDraftFilterWoredaId("");
                setDraftFilterKebeleId("");
                setDraftFilterClusterId("");
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
                setAppliedFilterKebeleId(draftFilterKebeleId);
                setAppliedFilterClusterId(draftFilterClusterId);
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

      <SHGFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingSHG={editingSHG}
        name={name}
        description={description}
        status={status}
        woredaId={woredaId}
        kebeleId={kebeleId}
        clusterId={clusterId}
        latitude={latitude}
        longitude={longitude}
        mapsUrl={mapsUrl}
        coordinateMode={coordinateMode}
        woredaOptions={woredaOptions}
        kebeleOptions={kebeleOptions}
        clusterFormOptions={clusterFormOptions}
        statusOptions={STATUS_OPTIONS}
        setName={setName}
        setDescription={setDescription}
        setStatus={setStatus}
        setWoredaId={setWoredaId}
        setKebeleId={setKebeleId}
        setClusterId={setClusterId}
        handleMapsUrlChange={handleMapsUrlChange}
        handleMapsUrlBlur={handleMapsUrlBlur}
        handleMapsPaste={handleMapsPaste}
        handleManualCoordinateInput={handleManualCoordinateInput}
        switchToMapLinkEntry={switchToMapLinkEntry}
        setCoordinateMode={setCoordinateMode}
        setMapsUrl={setMapsUrl}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
      />

      <SHGDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />

      <SHGDeleteDialog
        pendingDelete={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirmDelete={async () => {
          if (!pendingDelete) return;
          try {
            const result = await deleteMutation.mutateAsync(pendingDelete.id);
            sileo.success({ title: "SHG deleted", description: result.message });
            setPendingDelete(null);
          } catch (error) {
            sileo.error({
              title: "Could not delete SHG",
              description: error instanceof Error ? error.message : "Unexpected error",
            });
          }
        }}
      />
    </div>
  );
}
