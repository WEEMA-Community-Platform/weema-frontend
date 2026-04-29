"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useMemo, useState } from "react";
import { sileo } from "sileo";

import {
  useCreateKebeleMutation,
  useDeleteKebeleMutation,
  useKebelesQuery,
  useUpdateKebeleMutation,
  useWoredasQuery,
  useZonesQuery,
} from "@/hooks/use-base-data";
import { exportKebelesList, type Kebele } from "@/lib/api/base-data";
import { buildBaseDataCsv, downloadBaseDataCsv, exportFilename } from "@/lib/base-data-csv";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { DescriptionTableCell } from "@/components/base-data/description-table-cell";
import { SelectField } from "@/components/base-data/select-field";
import {
  DataToolbar,
  EmptyStateRow,
  PaginationRow,
  SaveButton,
  TableShell,
  baseDataDialogFieldGroupClass,
  formTextareaClass,
  inputClass,
  tableActionsCellClass,
  tableRowActionsClass,
  useListEmptyMessage,
  viewReadOnlyInputClass,
  viewReadOnlyTextareaClass,
} from "@/components/base-data/shared";

export function KebeleManager() {
  const t = useTranslations("basedata.kebele");
  const tCommon = useTranslations("basedata.common");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");
  const tListEmpty = useTranslations("listEmpty.entity");
  const tExport = useTranslations("basedata.export");
  const listEmptyMessage = useListEmptyMessage();

  const [searchQuery, setSearchQuery] = useState("");
  const [exportPending, setExportPending] = useState(false);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWoredaId, setSelectedWoredaId] = useState("");
  const [appliedFilterZoneId, setAppliedFilterZoneId] = useState("");
  const [appliedFilterWoredaId, setAppliedFilterWoredaId] = useState("");
  const [draftFilterZoneId, setDraftFilterZoneId] = useState("");
  const [draftFilterWoredaId, setDraftFilterWoredaId] = useState("");
  const [editingKebele, setEditingKebele] = useState<Kebele | null>(null);
  const [viewingKebele, setViewingKebele] = useState<Kebele | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingDeleteKebele, setPendingDeleteKebele] = useState<Kebele | null>(null);

  const zonesQuery = useZonesQuery({ page: 1, pageSize: 100 });
  const woredasForCreateQuery = useWoredasQuery({ page: 1, pageSize: 100 });
  const woredasForFilterDraftQuery = useWoredasQuery({
    page: 1,
    pageSize: 100,
    zoneId: draftFilterZoneId || undefined,
  });
  const kebelesQuery = useKebelesQuery({
    page,
    pageSize: 10,
    searchQuery,
    zoneId: appliedFilterZoneId || undefined,
    woredaId: appliedFilterWoredaId || undefined,
  });

  const createMutation = useCreateKebeleMutation();
  const updateMutation = useUpdateKebeleMutation();
  const deleteMutation = useDeleteKebeleMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const exportCsv = async () => {
    const str = (v: unknown) => (v == null ? "" : String(v));
    setExportPending(true);
    try {
      const { data } = await exportKebelesList();
      if (data.length === 0) {
        sileo.warning({
          title: tExport("emptyTitle"),
          description: tExport("emptyDescription"),
        });
        return;
      }
      const columns = [
        { header: tExport("columns.name"), cell: (r: Record<string, unknown>) => str(r.name) },
        {
          header: tExport("columns.region"),
          cell: (r: Record<string, unknown>) => str(r.regionName),
        },
        {
          header: tExport("columns.zone"),
          cell: (r: Record<string, unknown>) => str(r.zoneName),
        },
        {
          header: tExport("columns.woreda"),
          cell: (r: Record<string, unknown>) => str(r.woredaName),
        },
        {
          header: tExport("columns.description"),
          cell: (r: Record<string, unknown>) => str(r.description),
        },
        {
          header: tExport("columns.createdAt"),
          cell: (r: Record<string, unknown>) => str(r.createdAt),
        },
        {
          header: tExport("columns.updatedAt"),
          cell: (r: Record<string, unknown>) => str(r.updatedAt),
        },
      ];
      const csv = buildBaseDataCsv(columns, data);
      downloadBaseDataCsv(csv, exportFilename("kebeles"));
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

  const zoneOptions = useMemo(
    () => (zonesQuery.data?.zones ?? []).map((z) => ({ value: z.id, label: z.name })),
    [zonesQuery.data?.zones]
  );
  const woredaCreateOptions = useMemo(
    () => (woredasForCreateQuery.data?.woredas ?? []).map((w) => ({ value: w.id, label: w.name })),
    [woredasForCreateQuery.data?.woredas]
  );
  const woredaFilterOptions = useMemo(
    () => (woredasForFilterDraftQuery.data?.woredas ?? []).map((w) => ({ value: w.id, label: w.name })),
    [woredasForFilterDraftQuery.data?.woredas]
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedWoredaId("");
    setEditingKebele(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !selectedWoredaId) {
      sileo.warning({
        title: t("toasts.missingFieldsTitle"),
        description: t("toasts.missingFieldsMessage"),
      });
      return;
    }

    try {
      if (editingKebele) {
        const result = await updateMutation.mutateAsync({
          id: editingKebele.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            woredaId: selectedWoredaId,
          },
        });
        sileo.success({ title: t("toasts.updatedTitle"), description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          woredaId: selectedWoredaId,
        });
        sileo.success({ title: t("toasts.addedTitle"), description: result.message });
      }
      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: t("toasts.saveErrorTitle"),
        description: error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    }
  };

  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(appliedFilterZoneId || appliedFilterWoredaId);
  const kebelesEmptyMessage = listEmptyMessage({
    entityPlural: tListEmpty("kebeles"),
    hasSearch,
    hasFilters,
    emptyCatalogHint: t("emptyHint"),
  });

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t("title")}</CardTitle>
        <DataToolbar
          searchPlaceholder={t("searchPlaceholder")}
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onExport={exportCsv}
          exportLabel={tExport("button")}
          exportPendingLabel={tExport("exporting")}
          exportPending={exportPending}
          onAdd={() => {
            setViewingKebele(null);
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel={t("addButton")}
          showFilterButton
          onOpenFilters={() => setIsFilterOpen(true)}
          hasActiveFilters={hasFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={[
            tCommon("columnName"),
            t("woredaColumn"),
            tCommon("columnDescription"),
            tCommon("columnActions"),
          ]}
          loading={kebelesQuery.isLoading}
          loadingColumnCount={4}
          isError={kebelesQuery.isError}
          errorMessage={kebelesQuery.error instanceof Error ? kebelesQuery.error.message : undefined}
          onRetry={kebelesQuery.refetch}
          emptyState={<EmptyStateRow colSpan={4} message={kebelesEmptyMessage} />}
        >
          {kebelesQuery.data?.kebeles?.map((kebele) => (
            <TableRow key={kebele.id}>
              <TableCell className="align-top font-medium">{kebele.name}</TableCell>
              <TableCell className="align-top">{kebele.woredaName}</TableCell>
              <DescriptionTableCell description={kebele.description} />
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setViewingKebele(kebele);
                    }}
                  >
                    {tActions("view")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewingKebele(null);
                      setEditingKebele(kebele);
                      setName(kebele.name);
                      setDescription(kebele.description || "");
                      setSelectedWoredaId(kebele.woredaId);
                      setIsFormOpen(true);
                    }}
                  >
                    {tActions("edit")}
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteKebele(kebele)}>
                    {tActions("delete")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {kebelesQuery.data && (
          <PaginationRow
            currentPage={kebelesQuery.data.currentPage}
            totalPages={kebelesQuery.data.totalPages}
            totalElements={kebelesQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(kebelesQuery.data.totalPages, prev + 1))}
          />
        )}
      </CardContent>

      <Dialog
        open={!!viewingKebele}
        onOpenChange={(open) => {
          if (!open) setViewingKebele(null);
        }}
      >
        <DialogContent>
          <div className="flex max-h-[85vh] flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{t("view.title")}</DialogTitle>
              <DialogDescription>{t("view.description")}</DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="kebele-name-view">{t("nameLabel")}</FieldLabel>
                <Input
                  id="kebele-name-view"
                  readOnly
                  value={viewingKebele?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-woreda-view">{t("woredaLabel")}</FieldLabel>
                <SelectField
                  id="kebele-woreda-view"
                  value={viewingKebele?.woredaId ?? ""}
                  placeholder={t("woredaPlaceholder")}
                  options={woredaCreateOptions}
                  onValueChange={() => {}}
                  className={viewReadOnlyInputClass}
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-description-view">{tCommon("descriptionLabel")}</FieldLabel>
                <textarea
                  id="kebele-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingKebele?.description ?? ""}
                  placeholder={tCommon("descriptionPlaceholder")}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingKebele(null)}>
                {tActions("close")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingKebele ? t("form.titleEdit") : t("form.titleAdd")}</DialogTitle>
              <DialogDescription>
                {editingKebele ? t("form.descriptionEdit") : t("form.descriptionAdd")}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="kebele-name">{t("nameLabel")}</FieldLabel>
                <Input
                  id="kebele-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-woreda">{t("woredaLabel")}</FieldLabel>
                <SelectField
                  id="kebele-woreda"
                  value={selectedWoredaId}
                  placeholder={t("woredaPlaceholder")}
                  options={woredaCreateOptions}
                  onValueChange={setSelectedWoredaId}
                  className={inputClass}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-description">{tCommon("descriptionLabel")}</FieldLabel>
                <textarea
                  id="kebele-description"
                  className={formTextareaClass}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={tCommon("descriptionPlaceholder")}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <SaveButton
                isPending={isSubmitting}
                idleLabel={editingKebele ? t("form.saveEdit") : t("form.saveAdd")}
                pendingLabel={editingKebele ? tCommon("saving") : tCommon("adding")}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFilterOpen}
        onOpenChange={(open) => {
          setIsFilterOpen(open);
          if (open) {
            setDraftFilterZoneId(appliedFilterZoneId);
            setDraftFilterWoredaId(appliedFilterWoredaId);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("filters.title")}</DialogTitle>
            <DialogDescription>{t("filters.description")}</DialogDescription>
          </DialogHeader>
          <FieldGroup className={baseDataDialogFieldGroupClass}>
            <Field>
              <FieldLabel htmlFor="kebele-filter-zone">{t("filters.zoneLabel")}</FieldLabel>
              <SelectField
                id="kebele-filter-zone"
                value={draftFilterZoneId}
                placeholder={t("filters.zoneAll")}
                options={zoneOptions}
                onValueChange={(value) => {
                  setDraftFilterZoneId(value);
                  setDraftFilterWoredaId("");
                }}
                className={inputClass}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="kebele-filter-woreda">{t("filters.woredaLabel")}</FieldLabel>
              <SelectField
                id="kebele-filter-woreda"
                value={draftFilterWoredaId}
                placeholder={t("filters.woredaAll")}
                options={woredaFilterOptions}
                onValueChange={setDraftFilterWoredaId}
                className={inputClass}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setAppliedFilterZoneId("");
                setAppliedFilterWoredaId("");
                setDraftFilterZoneId("");
                setDraftFilterWoredaId("");
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              {tCommon("clearFilters")}
            </Button>
            <Button
              type="button"
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setAppliedFilterZoneId(draftFilterZoneId);
                setAppliedFilterWoredaId(draftFilterWoredaId);
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              {tCommon("applyFilters")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteKebele}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteKebele(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich("delete.confirm", {
                name: pendingDeleteKebele?.name ?? "",
                strong: (chunks) => (
                  <span className="font-semibold text-foreground">{chunks}</span>
                ),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tActions("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteKebele) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteKebele.id);
                  sileo.success({ title: t("toasts.deletedTitle"), description: result.message });
                  setPendingDeleteKebele(null);
                } catch (error) {
                  sileo.error({
                    title: t("toasts.deleteErrorTitle"),
                    description: error instanceof Error ? error.message : tValidation("unexpectedError"),
                  });
                }
              }}
            >
              {t("delete.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
