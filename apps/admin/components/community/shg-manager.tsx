"use client";

import { type ClipboardEvent, FormEvent, useMemo, useState } from "react";
import { LayersIcon, LockIcon, MapPinIcon, UnlockIcon, UsersIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import {
  useClustersQuery,
  useCreateSHGMutation,
  useDeleteSHGMutation,
  useLockSHGMutation,
  useSHGsQuery,
  useUnlockSHGMutation,
  useUpdateSHGMutation,
} from "@/hooks/use-community";
import { useKebelesQuery, useWoredasQuery } from "@/hooks/use-base-data";
import { useUsersQuery } from "@/hooks/use-users-admin";
import type { EntityStatus, SHG } from "@/lib/api/community";
import { extractLatLngFromMapsUrl } from "@/lib/maps-coordinates";
import {
  CardMetaRow,
  CommunityCard,
  CommunityCardSkeleton,
  LockedBadge,
} from "@/components/community/community-card";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  useListEmptyMessage,
} from "@/components/base-data/shared";
import { SelectField, filterQueryParam } from "@/components/base-data/select-field";
import {
  SHGDeleteDialog,
  SHGDetailDialog,
  SHGFormDialog,
  SHGLockDialog,
} from "@/components/community/shg-manager-dialogs";


export function SHGManager() {
  const tPage = useTranslations("community.shg.page");
  const tCard = useTranslations("community.shg.card");
  const tForm = useTranslations("community.shg.form");
  const tMenu = useTranslations("community.shg.menu");
  const tLockOptions = useTranslations("community.shg.lockOptions");
  const tToasts = useTranslations("community.shg.toasts");
  const tActions = useTranslations("common.actions");
  const tStatus = useTranslations("common.states");
  const tValidation = useTranslations("common.validation");
  const tEntity = useTranslations("listEmpty.entity");

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "ACTIVE", label: tStatus("active") },
      { value: "INACTIVE", label: tStatus("inactive") },
    ],
    [tStatus]
  );

  const LOCKED_OPTIONS = useMemo(
    () => [
      { value: "true", label: tLockOptions("locked") },
      { value: "false", label: tLockOptions("unlocked") },
    ],
    [tLockOptions]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EntityStatus | "">("");
  const [woredaId, setWoredaId] = useState("none");
  const [kebeleId, setKebeleId] = useState("none");
  /** Edit form only — new SHGs are created without a cluster; assign via Edit SHG. */
  const [clusterId, setClusterId] = useState("none");
  const [facilitatorId, setFacilitatorId] = useState("none");
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
  const [appliedFilterIsLocked, setAppliedFilterIsLocked] = useState("");
  const [draftFilterStatus, setDraftFilterStatus] = useState("");
  const [draftFilterWoredaId, setDraftFilterWoredaId] = useState("");
  const [draftFilterKebeleId, setDraftFilterKebeleId] = useState("");
  const [draftFilterClusterId, setDraftFilterClusterId] = useState("");
  const [draftFilterLocation, setDraftFilterLocation] = useState("");
  const [draftFilterIsLocked, setDraftFilterIsLocked] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingLock, setPendingLock] = useState<{ shg: SHG; action: "lock" | "unlock" } | null>(null);

  const isLockedFilter =
    appliedFilterIsLocked === "true" ? true : appliedFilterIsLocked === "false" ? false : undefined;

  const shgsQuery = useSHGsQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(appliedFilterStatus) as EntityStatus | undefined,
    woredaId: filterQueryParam(appliedFilterWoredaId),
    kebeleId: filterQueryParam(appliedFilterKebeleId),
    clusterId: filterQueryParam(appliedFilterClusterId),
    location: appliedFilterLocation.trim() || undefined,
    isLocked: isLockedFilter,
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
  const facilitatorsQuery = useUsersQuery({
    page: 1,
    pageSize: 200,
    roles: ["ROLE_FACILITATOR"],
    isActive: true,
  });

  const createMutation = useCreateSHGMutation();
  const updateMutation = useUpdateSHGMutation();
  const deleteMutation = useDeleteSHGMutation();
  const lockMutation = useLockSHGMutation();
  const unlockMutation = useUnlockSHGMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;


  const woredaOptions = useMemo(
    () => [
      { value: "none", label: tForm("options.noWoreda") },
      ...(woredaData?.woredas ?? []).map((w: { id: string; name: string }) => ({ value: w.id, label: w.name })),
    ],
    [woredaData?.woredas, tForm]
  );
  const kebeleOptions = useMemo(
    () => [
      { value: "none", label: tForm("options.noKebele") },
      ...(kebeleData?.kebeles ?? []).map((k: { id: string; name: string }) => ({ value: k.id, label: k.name })),
    ],
    [kebeleData?.kebeles, tForm]
  );

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
      { value: "none", label: tForm("noCluster") },
      ...(clustersData?.clusters ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [clustersData?.clusters, tForm]
  );
  const facilitatorOptions = useMemo(
    () => [
      { value: "none", label: tForm("noFacilitator") },
      ...(facilitatorsQuery.data?.users ?? []).map((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        return {
          value: user.id,
          label: fullName ? `${fullName} (${user.email})` : user.email,
        };
      }),
    ],
    [facilitatorsQuery.data?.users, tForm]
  );
  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("");
    setWoredaId("none");
    setKebeleId("none");
    setClusterId("none");
    setFacilitatorId("none");
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
    setFacilitatorId(s.facilitatorId || "none");
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
        title: tToasts("badMapLinkTitle"),
        description: tToasts("badMapLinkMessage"),
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
    if (!name.trim()) { sileo.warning({ title: tToasts("missingNameTitle"), description: tToasts("missingNameMessage") }); return; }
    if (!status) { sileo.warning({ title: tToasts("missingStatusTitle"), description: tToasts("missingStatusMessage") }); return; }
    const resolvedWoredaId = woredaId && woredaId !== "none" ? woredaId : undefined;
    const resolvedKebeleId = kebeleId && kebeleId !== "none" ? kebeleId : undefined;
    const resolvedClusterId = clusterId && clusterId !== "none" ? clusterId : undefined;
    const resolvedFacilitatorId =
      facilitatorId && facilitatorId !== "none" ? facilitatorId : null;
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    try {
      if (editingSHG) {
        const result = await updateMutation.mutateAsync({
          id: editingSHG.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            status,
            woredaId: resolvedWoredaId,
            kebeleId: resolvedKebeleId,
            clusterId: resolvedClusterId,
            facilitatorId: resolvedFacilitatorId,
            latitude: lat,
            longitude: lng,
          },
        });
        sileo.success({ title: tToasts("updatedTitle"), description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          status,
          woredaId: resolvedWoredaId,
          kebeleId: resolvedKebeleId,
          facilitatorId: resolvedFacilitatorId,
          latitude: lat,
          longitude: lng,
        });
        sileo.success({ title: tToasts("addedTitle"), description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: tToasts("saveErrorTitle"), description: error instanceof Error ? error.message : tValidation("unexpectedError") });
    }
  };

  const shgs = shgsQuery.data?.selfHelpGroups ?? [];
  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(
    appliedFilterStatus ||
      appliedFilterWoredaId ||
      appliedFilterKebeleId ||
      appliedFilterClusterId ||
      appliedFilterLocation.trim() ||
      appliedFilterIsLocked
  );
  const listEmptyMessage = useListEmptyMessage();
  const emptyMessage = listEmptyMessage({
    entityPlural: tEntity("selfHelpGroups"),
    hasSearch,
    hasFilters,
    emptyCatalogHint: tPage("emptyHint"),
  });

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder={tPage("searchPlaceholder")}
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onAdd={openCreate}
        addLabel={tPage("addButton")}
        showFilterButton
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasFilters}
      />

      {shgsQuery.isLoading ? (
        <CommunityCardSkeleton rowCount={4} />
      ) : shgsQuery.isError ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {shgsQuery.error instanceof Error ? shgsQuery.error.message : tPage("loadError")}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => shgsQuery.refetch()}>
            {tActions("retry")}
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
            const memberCount = s.memberCount ?? 0;
            return (
              <CommunityCard
                key={s.id}
                title={s.name}
                status={s.status}
                onView={() => setViewingId(s.id)}
                onEdit={() => openEdit(s)}
                onDelete={() => setPendingDelete(s)}
                extraMenuItems={
                  s.locked ? (
                    <DropdownMenuItem
                      className="text-[12px] whitespace-nowrap text-amber-600 focus:text-amber-600"
                      onClick={() => setPendingLock({ shg: s, action: "unlock" })}
                    >
                      <UnlockIcon className="size-3.5" />
                      {tMenu("unlock")}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-[12px] whitespace-nowrap text-slate-600 focus:text-slate-600"
                      onClick={() => setPendingLock({ shg: s, action: "lock" })}
                    >
                      <LockIcon className="size-3.5" />
                      {tMenu("lock")}
                    </DropdownMenuItem>
                  )
                }
              >
                <CardMetaRow icon={LayersIcon} label={tCard("cluster")}>
                  {s.clusterName ?? tCard("noCluster")}
                </CardMetaRow>
                <CardMetaRow icon={UserIcon} label={tCard("facilitator")}>
                  {s.facilitatorName ?? tCard("noFacilitator")}
                </CardMetaRow>
                <CardMetaRow icon={UsersIcon} label={tCard("members")}>
                  {memberCount === 1
                    ? tCard("memberOne", { count: memberCount })
                    : tCard("memberOther", { count: memberCount })}
                </CardMetaRow>
                <CardMetaRow icon={MapPinIcon} label={tCard("gps")}>
                  {hasGps ? `${s.latitude}, ${s.longitude}` : tCard("noCoordinates")}
                </CardMetaRow>
                <div className="mt-1">
                  <LockedBadge locked={s.locked} />
                </div>
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
            setDraftFilterIsLocked(appliedFilterIsLocked);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tPage("filterTitle")}</DialogTitle>
            <DialogDescription>{tPage("filterDescription")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(70vh,520px)] space-y-3 overflow-y-auto px-5 pb-4">
            <SelectField
              value={draftFilterStatus}
              placeholder={tPage("filterStatusAll")}
              options={STATUS_OPTIONS}
              onValueChange={setDraftFilterStatus}
            />
            <SelectField
              value={draftFilterIsLocked}
              placeholder={tPage("filterLockedAll")}
              options={LOCKED_OPTIONS}
              onValueChange={setDraftFilterIsLocked}
            />
            <SelectField
              value={draftFilterWoredaId}
              placeholder={tPage("filterWoredaAll")}
              options={woredaFilterOptions}
              onValueChange={(v) => {
                setDraftFilterWoredaId(v);
                setDraftFilterKebeleId("");
              }}
            />
            <SelectField
              value={draftFilterKebeleId}
              placeholder={tPage("filterKebeleAll")}
              options={kebeleFilterOptions}
              onValueChange={setDraftFilterKebeleId}
            />
            <SelectField
              value={draftFilterClusterId}
              placeholder={tPage("filterClusterAll")}
              options={clusterFilterOptions}
              onValueChange={setDraftFilterClusterId}
            />
            <Input
              placeholder={tPage("filterLocationPlaceholder")}
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
                setAppliedFilterIsLocked("");
                setDraftFilterStatus("");
                setDraftFilterWoredaId("");
                setDraftFilterKebeleId("");
                setDraftFilterClusterId("");
                setDraftFilterLocation("");
                setDraftFilterIsLocked("");
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              {tActions("clear")}
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
                setAppliedFilterIsLocked(draftFilterIsLocked);
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              {tActions("apply")}
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
        facilitatorId={facilitatorId}
        latitude={latitude}
        longitude={longitude}
        mapsUrl={mapsUrl}
        coordinateMode={coordinateMode}
        woredaOptions={woredaOptions}
        kebeleOptions={kebeleOptions}
        clusterFormOptions={clusterFormOptions}
        facilitatorOptions={facilitatorOptions}
        statusOptions={STATUS_OPTIONS}
        setName={setName}
        setDescription={setDescription}
        setStatus={setStatus}
        setWoredaId={setWoredaId}
        setKebeleId={setKebeleId}
        setClusterId={setClusterId}
        setFacilitatorId={setFacilitatorId}
        handleMapsUrlChange={handleMapsUrlChange}
        handleMapsUrlBlur={handleMapsUrlBlur}
        handleMapsPaste={handleMapsPaste}
        handleManualCoordinateInput={handleManualCoordinateInput}
        switchToMapLinkEntry={switchToMapLinkEntry}
        setCoordinateMode={setCoordinateMode}
        setMapsUrl={setMapsUrl}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
        isFacilitatorsLoading={facilitatorsQuery.isLoading || facilitatorsQuery.isFetching}
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
            sileo.success({ title: tToasts("deletedTitle"), description: result.message });
            setPendingDelete(null);
          } catch (error) {
            sileo.error({
              title: tToasts("deleteErrorTitle"),
              description: error instanceof Error ? error.message : tValidation("unexpectedError"),
            });
          }
        }}
      />

      <SHGLockDialog
        shg={pendingLock?.shg ?? null}
        action={pendingLock?.action ?? "lock"}
        onOpenChange={(open) => { if (!open) setPendingLock(null); }}
        lockMutation={lockMutation}
        unlockMutation={unlockMutation}
      />
    </div>
  );
}
