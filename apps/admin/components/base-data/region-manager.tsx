"use client";

import { FormEvent, useState } from "react";
import { sileo } from "sileo";

import {
  useCreateRegionMutation,
  useDeleteRegionMutation,
  useRegionsQuery,
  useUpdateRegionMutation,
} from "@/hooks/use-base-data";
import type { Region } from "@/lib/api/base-data";
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

export function RegionManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [viewingRegion, setViewingRegion] = useState<Region | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteRegion, setPendingDeleteRegion] = useState<Region | null>(null);

  const regionsQuery = useRegionsQuery({ page, pageSize: 10, searchQuery });
  const createMutation = useCreateRegionMutation();
  const updateMutation = useUpdateRegionMutation();
  const deleteMutation = useDeleteRegionMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const hasSearch = Boolean(searchQuery.trim());
  const regionsEmptyMessage = listEmptyMessage({
    entityPlural: "regions",
    hasSearch,
    hasFilters: false,
    emptyCatalogHint: "No regions yet. Add your first region to get started.",
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingRegion(null);
  };

  const openCreate = () => {
    setViewingRegion(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (region: Region) => {
    setViewingRegion(null);
    setEditingRegion(region);
    setName(region.name);
    setDescription(region.description || "");
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      sileo.warning({ title: "Missing name", description: "Region name is required." });
      return;
    }

    try {
      if (editingRegion) {
        const result = await updateMutation.mutateAsync({
          id: editingRegion.id,
          payload: { name: name.trim(), description: description.trim() },
        });
        sileo.success({ title: "Region updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
        });
        sileo.success({ title: "Region added", description: result.message });
      }

      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save region",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Regions</CardTitle>
        <DataToolbar
          searchPlaceholder="Search regions"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onAdd={openCreate}
          addLabel="Add region"
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Description", "Actions"]}
          loading={regionsQuery.isLoading}
          loadingColumnCount={3}
          isError={regionsQuery.isError}
          errorMessage={regionsQuery.error instanceof Error ? regionsQuery.error.message : undefined}
          onRetry={regionsQuery.refetch}
          emptyState={<EmptyStateRow colSpan={3} message={regionsEmptyMessage} />}
        >
          {regionsQuery.data?.regions?.map((region) => (
            <TableRow key={region.id}>
              <TableCell className="align-top font-medium">{region.name}</TableCell>
              <DescriptionTableCell
                description={region.description}
              />
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setViewingRegion(region);
                    }}
                  >
                    View
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(region)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteRegion(region)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {regionsQuery.data && (
          <PaginationRow
            currentPage={regionsQuery.data.currentPage}
            totalPages={regionsQuery.data.totalPages}
            totalElements={regionsQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() =>
              setPage((prev) => Math.min(regionsQuery.data?.totalPages ?? prev, prev + 1))
            }
          />
        )}
      </CardContent>

      <Dialog
        open={!!viewingRegion}
        onOpenChange={(open) => {
          if (!open) setViewingRegion(null);
        }}
      >
        <DialogContent>
          <div className="flex max-h-[85vh] flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>View region</DialogTitle>
              <DialogDescription>Read-only details for this region.</DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="region-name-view">Region name</FieldLabel>
                <Input
                  id="region-name-view"
                  readOnly
                  value={viewingRegion?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="region-description-view">Description</FieldLabel>
                <textarea
                  id="region-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingRegion?.description ?? ""}
                  placeholder="Optional details"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingRegion(null)}>
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
              <DialogTitle>{editingRegion ? "Edit region" : "Add region"}</DialogTitle>
              <DialogDescription>
                {editingRegion
                  ? "Update region details, then save your changes."
                  : "Add a new region to your base data list."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="region-name">Region name</FieldLabel>
                <Input
                  id="region-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="region-description">Description</FieldLabel>
                <textarea
                  id="region-description"
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
                idleLabel={editingRegion ? "Save region" : "Add region"}
                pendingLabel={editingRegion ? "Saving..." : "Adding..."}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteRegion}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteRegion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete region</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{pendingDeleteRegion?.name}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteRegion) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteRegion.id);
                  sileo.success({ title: "Region deleted", description: result.message });
                  setPendingDeleteRegion(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete region",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete region
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
