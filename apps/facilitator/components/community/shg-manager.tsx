"use client";

import { type ClipboardEvent, FormEvent, useMemo, useState } from "react";
import { LayersIcon, MapPinIcon, UsersIcon, UserIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useCreateSHGMutation,
  useSHGsQuery,
} from "@/hooks/use-community";
import { useKebelesQuery, useWoredasQuery } from "@/hooks/use-base-data";
import type { SHG } from "@/lib/api/community";
import { extractLatLngFromMapsUrl } from "@/lib/maps-coordinates";
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
} from "@/components/community/community-card";
import { Button } from "@/components/ui/button";
import {
  DataToolbar,
  PaginationRow,
  listEmptyMessage,
} from "@/components/base-data/shared";
import {
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
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "">("");
  const [woredaId, setWoredaId] = useState("none");
  const [kebeleId, setKebeleId] = useState("none");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [coordinateMode, setCoordinateMode] = useState<"idle" | "map" | "manual">("idle");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const shgsQuery = useSHGsQuery({ page, pageSize: 12, searchQuery });
  const { data: woredaData } = useWoredasQuery({ page: 1, pageSize: 200, searchQuery: "" });
  const { data: kebeleData } = useKebelesQuery({ page: 1, pageSize: 200, searchQuery: "" });

  const createMutation = useCreateSHGMutation();

  const woredaOptions = useMemo(
    () => [
      { value: "none", label: "No woreda" },
      ...(woredaData?.woredas ?? []).map((w: { id: string; name: string }) => ({ value: w.id, label: w.name })),
    ],
    [woredaData?.woredas]
  );
  const kebeleOptions = useMemo(
    () => [
      { value: "none", label: "No kebele" },
      ...(kebeleData?.kebeles ?? []).map((k: { id: string; name: string }) => ({ value: k.id, label: k.name })),
    ],
    [kebeleData?.kebeles]
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("");
    setWoredaId("none");
    setKebeleId("none");
    setLatitude("");
    setLongitude("");
    setMapsUrl("");
    setCoordinateMode("idle");
  };

  const openCreate = () => { resetForm(); setIsFormOpen(true); };

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
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    try {
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
      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({ title: "Could not save SHG", description: error instanceof Error ? error.message : "Unexpected error" });
    }
  };

  const shgs = shgsQuery.data?.selfHelpGroups ?? [];
  const hasSearch = Boolean(searchQuery.trim());
  const emptyMessage = listEmptyMessage({
    entityPlural: "self-help groups",
    hasSearch,
    hasFilters: false,
    emptyCatalogHint: "No self-help groups found. Add your first SHG to get started.",
  });

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder="Search self-help groups"
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onAdd={openCreate}
        addLabel="Add SHG"
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
                showEditAction={false}
                showDeleteAction={false}
                viewActionLabel="View details"
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

      <SHGFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingSHG={null}
        name={name}
        description={description}
        status={status}
        woredaId={woredaId}
        kebeleId={kebeleId}
        clusterId="none"
        latitude={latitude}
        longitude={longitude}
        mapsUrl={mapsUrl}
        coordinateMode={coordinateMode}
        woredaOptions={woredaOptions}
        kebeleOptions={kebeleOptions}
        clusterFormOptions={[]}
        statusOptions={STATUS_OPTIONS}
        setName={setName}
        setDescription={setDescription}
        setStatus={setStatus}
        setWoredaId={setWoredaId}
        setKebeleId={setKebeleId}
        setClusterId={() => {}}
        handleMapsUrlChange={handleMapsUrlChange}
        handleMapsUrlBlur={handleMapsUrlBlur}
        handleMapsPaste={handleMapsPaste}
        handleManualCoordinateInput={handleManualCoordinateInput}
        switchToMapLinkEntry={switchToMapLinkEntry}
        setCoordinateMode={setCoordinateMode}
        setMapsUrl={setMapsUrl}
        onSubmit={submitForm}
        isSubmitting={createMutation.isPending}
      />

      <SHGDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
}
