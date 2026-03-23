"use client";

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
import type { Kebele } from "@/lib/api/base-data";
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
import { SelectField } from "@/components/base-data/select-field";
import {
  DataToolbar,
  EmptyStateRow,
  PaginationRow,
  SaveButton,
  TableShell,
  descriptionCellClass,
  inputClass,
} from "@/components/base-data/shared";

export function KebeleManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWoredaId, setSelectedWoredaId] = useState("");
  const [zoneFilterId, setZoneFilterId] = useState("");
  const [woredaFilterId, setWoredaFilterId] = useState("");
  const [editingKebele, setEditingKebele] = useState<Kebele | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingDeleteKebele, setPendingDeleteKebele] = useState<Kebele | null>(null);

  const zonesQuery = useZonesQuery({ page: 1, pageSize: 100 });
  const woredasForCreateQuery = useWoredasQuery({ page: 1, pageSize: 100 });
  const woredasForFilterQuery = useWoredasQuery({
    page: 1,
    pageSize: 100,
    zoneId: zoneFilterId || undefined,
  });
  const kebelesQuery = useKebelesQuery({
    page,
    pageSize: 10,
    searchQuery,
    zoneId: zoneFilterId || undefined,
    woredaId: woredaFilterId || undefined,
  });

  const createMutation = useCreateKebeleMutation();
  const updateMutation = useUpdateKebeleMutation();
  const deleteMutation = useDeleteKebeleMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const zoneOptions = useMemo(
    () => (zonesQuery.data?.zones ?? []).map((z) => ({ value: z.id, label: z.name })),
    [zonesQuery.data?.zones]
  );
  const woredaCreateOptions = useMemo(
    () => (woredasForCreateQuery.data?.woredas ?? []).map((w) => ({ value: w.id, label: w.name })),
    [woredasForCreateQuery.data?.woredas]
  );
  const woredaFilterOptions = useMemo(
    () => (woredasForFilterQuery.data?.woredas ?? []).map((w) => ({ value: w.id, label: w.name })),
    [woredasForFilterQuery.data?.woredas]
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
      sileo.warning({ title: "Missing fields", description: "Kebele name and woreda are required." });
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
        sileo.success({ title: "Kebele updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          woredaId: selectedWoredaId,
        });
        sileo.success({ title: "Kebele added", description: result.message });
      }
      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save kebele",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Kebeles</CardTitle>
        <DataToolbar
          searchPlaceholder="Search kebeles"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onAdd={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel="Add kebele"
          showFilterButton
          onOpenFilters={() => setIsFilterOpen(true)}
          hasActiveFilters={Boolean(zoneFilterId || woredaFilterId)}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Woreda", "Description", "Actions"]}
          loading={kebelesQuery.isLoading}
          loadingColumnCount={4}
          isError={kebelesQuery.isError}
          errorMessage={kebelesQuery.error instanceof Error ? kebelesQuery.error.message : undefined}
          onRetry={kebelesQuery.refetch}
          emptyState={<EmptyStateRow colSpan={4} message="No kebeles found. Add your first kebele to get started." />}
        >
          {kebelesQuery.data?.kebeles?.map((kebele) => (
            <TableRow key={kebele.id}>
              <TableCell className="font-medium">{kebele.name}</TableCell>
              <TableCell>{kebele.woredaName}</TableCell>
              <TableCell className={descriptionCellClass}>{kebele.description || "---"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingKebele(kebele);
                      setName(kebele.name);
                      setDescription(kebele.description || "");
                      setSelectedWoredaId(kebele.woredaId);
                      setIsFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteKebele(kebele)}>
                    Delete
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingKebele ? "Edit kebele" : "Add kebele"}</DialogTitle>
              <DialogDescription>
                {editingKebele
                  ? "Update kebele details, then save your changes."
                  : "Add a new kebele to your base data list."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Kebele name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              <textarea
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <SelectField value={selectedWoredaId} placeholder="Select woreda" options={woredaCreateOptions} onValueChange={setSelectedWoredaId} />
            </div>
            <DialogFooter>
              <SaveButton
                isPending={isSubmitting}
                idleLabel={editingKebele ? "Save kebele" : "Add kebele"}
                pendingLabel={editingKebele ? "Saving..." : "Adding..."}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter kebeles</DialogTitle>
            <DialogDescription>Apply filters to narrow down the kebele list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <SelectField
              value={zoneFilterId}
              placeholder="All zones"
              options={zoneOptions}
              onValueChange={(value) => {
                setZoneFilterId(value);
                setWoredaFilterId("");
                setPage(1);
              }}
            />
            <SelectField
              value={woredaFilterId}
              placeholder="All woredas"
              options={woredaFilterOptions}
              onValueChange={(value) => {
                setWoredaFilterId(value);
                setPage(1);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setZoneFilterId("");
                setWoredaFilterId("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
            <Button type="button" className="h-11 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsFilterOpen(false)}>
              Apply filters
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
            <AlertDialogTitle>Delete kebele</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{pendingDeleteKebele?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteKebele) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteKebele.id);
                  sileo.success({ title: "Kebele deleted", description: result.message });
                  setPendingDeleteKebele(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete kebele",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete kebele
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
