"use client";

import { FormEvent, useMemo, useState } from "react";
import { LayersIcon, LinkIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import {
  useCreateFederationMutation,
  useDeleteFederationMutation,
  useFederationsQuery,
  useUpdateFederationMutation,
} from "@/hooks/use-community";
import { useCurrentUser } from "@/hooks/use-user";
import type { EntityStatus, Federation } from "@/lib/api/community";
import { exportFederationsList } from "@/lib/api/community";
import { buildBaseDataCsv, downloadBaseDataCsv, exportFilename } from "@/lib/base-data-csv";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  AssignClustersDialog,
  FederationDeleteDialog,
  FederationDetailDialog,
  FederationFormDialog,
} from "@/components/community/federation-manager-dialogs";


export function FederationManager() {
  const tPage = useTranslations("community.federation.page");
  const tCard = useTranslations("community.federation.card");
  const tFilters = useTranslations("community.federation.filters");
  const tToasts = useTranslations("community.federation.toasts");
  const tActions = useTranslations("common.actions");
  const tStatus = useTranslations("common.states");
  const tValidation = useTranslations("common.validation");
  const tEntity = useTranslations("listEmpty.entity");
  const tExport = useTranslations("community.export");
  const tFedCols = useTranslations("community.export.federation.columns");

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "ACTIVE", label: tStatus("active") },
      { value: "INACTIVE", label: tStatus("inactive") },
    ],
    [tStatus]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [appliedFilterStatus, setAppliedFilterStatus] = useState("");
  const [appliedFilterLocation, setAppliedFilterLocation] = useState("");
  const [draftFilterStatus, setDraftFilterStatus] = useState("");
  const [draftFilterLocation, setDraftFilterLocation] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<EntityStatus | "">("");
  const [editingFederation, setEditingFederation] = useState<Federation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Federation | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [assigningFederation, setAssigningFederation] = useState<Federation | null>(null);
  const [exportPending, setExportPending] = useState(false);

  const federationsQuery = useFederationsQuery({
    page,
    pageSize: 12,
    searchQuery,
    status: filterQueryParam(appliedFilterStatus) as EntityStatus | undefined,
    location: appliedFilterLocation.trim() || undefined,
  });

  const { data: currentUserData } = useCurrentUser();
  const createMutation = useCreateFederationMutation();
  const updateMutation = useUpdateFederationMutation();
  const deleteMutation = useDeleteFederationMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => { setName(""); setDescription(""); setLocation(""); setStatus(""); setEditingFederation(null); };
  const openCreate = () => { resetForm(); setIsFormOpen(true); };
  const openEdit = (f: Federation) => { setEditingFederation(f); setName(f.name); setDescription(f.description || ""); setLocation(f.location || ""); setStatus(f.status); setIsFormOpen(true); };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { sileo.warning({ title: tToasts("missingNameTitle"), description: tToasts("missingNameMessage") }); return; }
    if (!status) { sileo.warning({ title: tToasts("missingStatusTitle"), description: tToasts("missingStatusMessage") }); return; }
    const managerId = currentUserData?.user?.id;
    try {
      if (editingFederation) {
        const result = await updateMutation.mutateAsync({ id: editingFederation.id, payload: { name: name.trim(), description: description.trim(), location: location.trim(), status, ...(managerId ? { managerId } : {}) } });
        sileo.success({ title: tToasts("updatedTitle"), description: result.message });
      } else {
        const result = await createMutation.mutateAsync({ name: name.trim(), description: description.trim(), location: location.trim(), status, ...(managerId ? { managerId } : {}) });
        sileo.success({ title: tToasts("addedTitle"), description: result.message });
      }
      setPage(1); setIsFormOpen(false); resetForm();
    } catch (error) {
      sileo.error({ title: tToasts("saveErrorTitle"), description: error instanceof Error ? error.message : tValidation("unexpectedError") });
    }
  };

  const federations = federationsQuery.data?.federations ?? [];
  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(appliedFilterStatus || appliedFilterLocation.trim());
  const listEmptyMessage = useListEmptyMessage();
  const emptyMessage = listEmptyMessage({
    entityPlural: tEntity("federations"),
    hasSearch,
    hasFilters,
    emptyCatalogHint: tPage("emptyHint"),
  });

  const entityStatusLabel = (raw: string) =>
    raw === "ACTIVE" ? tStatus("active") : raw === "INACTIVE" ? tStatus("inactive") : raw;

  const exportCsv = async () => {
    const str = (v: unknown) => (v == null ? "" : String(v));
    setExportPending(true);
    try {
      const { data } = await exportFederationsList();
      if (data.length === 0) {
        sileo.warning({
          title: tExport("emptyTitle"),
          description: tExport("emptyDescription"),
        });
        return;
      }
      const columns = [
        { header: tFedCols("name"), cell: (r: Record<string, unknown>) => str(r.name) },
        { header: tFedCols("description"), cell: (r: Record<string, unknown>) => str(r.description) },
        { header: tFedCols("location"), cell: (r: Record<string, unknown>) => str(r.location) },
        {
          header: tFedCols("status"),
          cell: (r: Record<string, unknown>) => entityStatusLabel(String(r.status ?? "")),
        },
        { header: tFedCols("manager"), cell: (r: Record<string, unknown>) => str(r.managerName) },
        { header: tFedCols("clusterCount"), cell: (r: Record<string, unknown>) => str(r.clusterCount) },
        { header: tFedCols("createdAt"), cell: (r: Record<string, unknown>) => str(r.createdAt) },
        { header: tFedCols("updatedAt"), cell: (r: Record<string, unknown>) => str(r.updatedAt) },
      ];
      const csv = buildBaseDataCsv(columns, data);
      downloadBaseDataCsv(csv, exportFilename("federations"));
      sileo.success({
        title: tExport("successTitle"),
        description: tExport("successDescription", { count: data.length }),
      });
    } catch (error) {
      sileo.error({
        title: tExport("errorTitle"),
        description: error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    } finally {
      setExportPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <DataToolbar
        searchPlaceholder={tPage("searchPlaceholder")}
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onExport={exportCsv}
        exportLabel={tExport("button")}
        exportPendingLabel={tExport("exporting")}
        exportPending={exportPending}
        onAdd={openCreate}
        addLabel={tPage("addButton")}
        showFilterButton
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasFilters}
      />

      {federationsQuery.isLoading ? (
        <CommunityCardSkeleton rowCount={2} />
      ) : federationsQuery.isError ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {federationsQuery.error instanceof Error ? federationsQuery.error.message : tPage("loadError")}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => federationsQuery.refetch()}>
            {tActions("retry")}
          </Button>
        </div>
      ) : federations.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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
                  <LinkIcon />{tPage("assignClusters")}
                </DropdownMenuItem>
              }
            >
              <CardMetaRow icon={UserIcon} label={tCard("manager")}>
                {f.managerName ?? tCard("noManager")}
              </CardMetaRow>
              <CardMetaRow icon={LayersIcon} label={tCard("clusters")}>
                {f.clusterCount === 1
                  ? tCard("clusterOne", { count: f.clusterCount })
                  : tCard("clusterOther", { count: f.clusterCount })}
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

      <Dialog
        open={isFilterOpen}
        onOpenChange={(open) => {
          setIsFilterOpen(open);
          if (open) {
            setDraftFilterStatus(appliedFilterStatus);
            setDraftFilterLocation(appliedFilterLocation);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tFilters("title")}</DialogTitle>
            <DialogDescription>{tFilters("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <SelectField
              value={draftFilterStatus}
              placeholder={tFilters("statusAll")}
              options={STATUS_OPTIONS}
              onValueChange={setDraftFilterStatus}
            />
            <Input
              placeholder={tFilters("locationPlaceholder")}
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
                setAppliedFilterLocation("");
                setDraftFilterStatus("");
                setDraftFilterLocation("");
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
                setAppliedFilterLocation(draftFilterLocation);
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              {tActions("apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FederationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingFederation={editingFederation}
        name={name}
        description={description}
        location={location}
        status={status}
        setName={setName}
        setDescription={setDescription}
        setLocation={setLocation}
        setStatus={setStatus}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
        statusOptions={STATUS_OPTIONS}
      />

      <FederationDetailDialog id={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />

      <AssignClustersDialog
        federation={assigningFederation}
        open={!!assigningFederation}
        onClose={() => setAssigningFederation(null)}
      />

      <FederationDeleteDialog
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
    </div>
  );
}
