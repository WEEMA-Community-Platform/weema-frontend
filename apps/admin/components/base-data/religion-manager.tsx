"use client";

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
  listEmptyMessage,
  tableActionsCellClass,
  tableRowActionsClass,
  viewReadOnlyInputClass,
  viewReadOnlyTextareaClass,
} from "@/components/base-data/shared";

export function ReligionManager() {
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
    entityPlural: "religions",
    hasSearch,
    hasFilters: false,
    emptyCatalogHint: "No religions yet. Add your first religion to get started.",
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingReligion(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      sileo.warning({ title: "Missing name", description: "Religion name is required." });
      return;
    }

    try {
      if (editingReligion) {
        const result = await updateMutation.mutateAsync({
          id: editingReligion.id,
          payload: { name: name.trim(), description: description.trim() },
        });
        sileo.success({ title: "Religion updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
        });
        sileo.success({ title: "Religion added", description: result.message });
      }

      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save religion",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Religions</CardTitle>
        <DataToolbar
          searchPlaceholder="Search religions"
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
          addLabel="Add religion"
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Description", "Actions"]}
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
                    View
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
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setPendingDeleteReligion(religion)}
                  >
                    Delete
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
              <DialogTitle>View religion</DialogTitle>
              <DialogDescription>Read-only details for this religion.</DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="religion-name-view">Religion name</FieldLabel>
                <Input
                  id="religion-name-view"
                  readOnly
                  value={viewingReligion?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="religion-description-view">Description</FieldLabel>
                <textarea
                  id="religion-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingReligion?.description ?? ""}
                  placeholder="Optional details"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingReligion(null)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingReligion ? "Edit religion" : "Add religion"}</DialogTitle>
              <DialogDescription>
                {editingReligion
                  ? "Update religion details, then save your changes."
                  : "Add a new religion to your base data list."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="religion-name">Religion name</FieldLabel>
                <Input
                  id="religion-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="religion-description">Description</FieldLabel>
                <textarea
                  id="religion-description"
                  className={formTextareaClass}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional details"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <SaveButton
                isPending={isSubmitting}
                idleLabel={editingReligion ? "Save religion" : "Add religion"}
                pendingLabel={editingReligion ? "Saving..." : "Adding..."}
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
            <AlertDialogTitle>Delete religion</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{pendingDeleteReligion?.name}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteReligion) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteReligion.id);
                  sileo.success({ title: "Religion deleted", description: result.message });
                  setPendingDeleteReligion(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete religion",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete religion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
