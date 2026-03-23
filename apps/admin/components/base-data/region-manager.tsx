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
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DataToolbar,
  EmptyStateRow,
  PaginationRow,
  SaveButton,
  TableShell,
  descriptionCellClass,
  inputClass,
} from "@/components/base-data/shared";

export function RegionManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteRegion, setPendingDeleteRegion] = useState<Region | null>(null);

  const regionsQuery = useRegionsQuery({ page, pageSize: 10, searchQuery });
  const createMutation = useCreateRegionMutation();
  const updateMutation = useUpdateRegionMutation();
  const deleteMutation = useDeleteRegionMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingRegion(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (region: Region) => {
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
          emptyState={<EmptyStateRow colSpan={3} message="No regions found. Add your first region to get started." />}
        >
          {regionsQuery.data?.regions?.map((region) => (
            <TableRow key={region.id}>
              <TableCell className="font-medium">{region.name}</TableCell>
              <TableCell className={descriptionCellClass}>{region.description || "---"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
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
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input
                placeholder="Region name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
              <textarea
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
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
