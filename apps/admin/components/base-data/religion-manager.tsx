"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { sileo } from "sileo";

import {
  useCreateReligionMutation,
  useDeleteReligionMutation,
  useReligionsQuery,
  useUpdateReligionMutation,
} from "@/hooks/use-base-data";
import type { Religion } from "@/lib/api/base-data";
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

export function ReligionManager() {
  const t = useTranslations("basedata.religion");
  const tCommon = useTranslations("basedata.common");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");
  const tListEmpty = useTranslations("listEmpty.entity");
  const listEmptyMessage = useListEmptyMessage();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingReligion, setEditingReligion] = useState<Religion | null>(null);
  const [viewingReligion, setViewingReligion] = useState<Religion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteReligion, setPendingDeleteReligion] = useState<Religion | null>(
    null
  );

  const religionsQuery = useReligionsQuery({ page, pageSize: 10, searchQuery });
  const createMutation = useCreateReligionMutation();
  const updateMutation = useUpdateReligionMutation();
  const deleteMutation = useDeleteReligionMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const hasSearch = Boolean(searchQuery.trim());
  const religionsEmptyMessage = listEmptyMessage({
    entityPlural: tListEmpty("religions"),
    hasSearch,
    hasFilters: false,
    emptyCatalogHint: t("emptyHint"),
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingReligion(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      sileo.warning({
        title: t("toasts.missingNameTitle"),
        description: t("toasts.missingNameMessage"),
      });
      return;
    }

    try {
      if (editingReligion) {
        const result = await updateMutation.mutateAsync({
          id: editingReligion.id,
          payload: { name: name.trim(), description: description.trim() },
        });
        sileo.success({ title: t("toasts.updatedTitle"), description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
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
          onAdd={() => {
            setViewingReligion(null);
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel={t("addButton")}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={[tCommon("columnName"), tCommon("columnDescription"), tCommon("columnActions")]}
          loading={religionsQuery.isLoading}
          loadingColumnCount={3}
          isError={religionsQuery.isError}
          errorMessage={religionsQuery.error instanceof Error ? religionsQuery.error.message : undefined}
          onRetry={religionsQuery.refetch}
          emptyState={<EmptyStateRow colSpan={3} message={religionsEmptyMessage} />}
        >
          {religionsQuery.data?.religions?.map((religion) => (
            <TableRow key={religion.id}>
              <TableCell className="align-top font-medium">{religion.name}</TableCell>
              <DescriptionTableCell description={religion.description} />
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setViewingReligion(religion);
                    }}
                  >
                    {tActions("view")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewingReligion(null);
                      setEditingReligion(religion);
                      setName(religion.name);
                      setDescription(religion.description || "");
                      setIsFormOpen(true);
                    }}
                  >
                    {tActions("edit")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setPendingDeleteReligion(religion)}
                  >
                    {tActions("delete")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {religionsQuery.data && (
          <PaginationRow
            currentPage={religionsQuery.data.currentPage}
            totalPages={religionsQuery.data.totalPages}
            totalElements={religionsQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() =>
              setPage((prev) => Math.min(religionsQuery.data.totalPages, prev + 1))
            }
          />
        )}
      </CardContent>

      <Dialog
        open={!!viewingReligion}
        onOpenChange={(open) => {
          if (!open) setViewingReligion(null);
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
                <FieldLabel htmlFor="religion-name-view">{t("nameLabel")}</FieldLabel>
                <Input
                  id="religion-name-view"
                  readOnly
                  value={viewingReligion?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="religion-description-view">{tCommon("descriptionLabel")}</FieldLabel>
                <textarea
                  id="religion-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingReligion?.description ?? ""}
                  placeholder={tCommon("descriptionPlaceholder")}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingReligion(null)}>
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
              <DialogTitle>{editingReligion ? t("form.titleEdit") : t("form.titleAdd")}</DialogTitle>
              <DialogDescription>
                {editingReligion ? t("form.descriptionEdit") : t("form.descriptionAdd")}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="religion-name">{t("nameLabel")}</FieldLabel>
                <Input
                  id="religion-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="religion-description">{tCommon("descriptionLabel")}</FieldLabel>
                <textarea
                  id="religion-description"
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
                idleLabel={editingReligion ? t("form.saveEdit") : t("form.saveAdd")}
                pendingLabel={editingReligion ? tCommon("saving") : tCommon("adding")}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteReligion}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteReligion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich("delete.confirm", {
                name: pendingDeleteReligion?.name ?? "",
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
                if (!pendingDeleteReligion) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteReligion.id);
                  sileo.success({ title: t("toasts.deletedTitle"), description: result.message });
                  setPendingDeleteReligion(null);
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
