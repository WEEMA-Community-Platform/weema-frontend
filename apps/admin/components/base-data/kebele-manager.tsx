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
  listEmptyMessage,
  tableActionsCellClass,
  tableRowActionsClass,
  viewReadOnlyInputClass,
  viewReadOnlyTextareaClass,
} from "@/components/base-data/shared";

export function KebeleManager() {
  const [searchQuery, setSearchQuery] = useState("");
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

  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(appliedFilterZoneId || appliedFilterWoredaId);
  const kebelesEmptyMessage = listEmptyMessage({
    entityPlural: "kebeles",
    hasSearch,
    hasFilters,
    emptyCatalogHint: "No kebeles yet. Add your first kebele to get started.",
  });

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
            setViewingKebele(null);
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel="Add kebele"
          showFilterButton
          onOpenFilters={() => setIsFilterOpen(true)}
          hasActiveFilters={hasFilters}
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
          emptyState={<EmptyStateRow colSpan={4} message={kebelesEmptyMessage} />}
        >
          {kebelesQuery.data?.kebeles?.map((kebele) => (
            <TableRow key={kebele.id}>
              <TableCell className="align-top font-medium">{kebele.name}</TableCell>
              <TableCell className="align-top">{kebele.woredaName}</TableCell>
              <DescriptionTableCell
                description={kebele.description}
                onView={() => {
                  setIsFormOpen(false);
                  setViewingKebele(kebele);
                }}
              />
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
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

      <Dialog
        open={!!viewingKebele}
        onOpenChange={(open) => {
          if (!open) setViewingKebele(null);
        }}
      >
        <DialogContent>
          <div className="flex max-h-[85vh] flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>View kebele</DialogTitle>
              <DialogDescription>Read-only details for this kebele.</DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="kebele-name-view">Kebele name</FieldLabel>
                <Input
                  id="kebele-name-view"
                  readOnly
                  value={viewingKebele?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-woreda-view">Woreda</FieldLabel>
                <SelectField
                  id="kebele-woreda-view"
                  value={viewingKebele?.woredaId ?? ""}
                  placeholder="Select woreda"
                  options={woredaCreateOptions}
                  onValueChange={() => {}}
                  className={viewReadOnlyInputClass}
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-description-view">Description</FieldLabel>
                <textarea
                  id="kebele-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingKebele?.description ?? ""}
                  placeholder="Optional details"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingKebele(null)}>
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
              <DialogTitle>{editingKebele ? "Edit kebele" : "Add kebele"}</DialogTitle>
              <DialogDescription>
                {editingKebele
                  ? "Update kebele details, then save your changes."
                  : "Add a new kebele to your base data list."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="kebele-name">Kebele name</FieldLabel>
                <Input
                  id="kebele-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-woreda">Woreda</FieldLabel>
                <SelectField
                  id="kebele-woreda"
                  value={selectedWoredaId}
                  placeholder="Select woreda"
                  options={woredaCreateOptions}
                  onValueChange={setSelectedWoredaId}
                  className={inputClass}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kebele-description">Description</FieldLabel>
                <textarea
                  id="kebele-description"
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
                idleLabel={editingKebele ? "Save kebele" : "Add kebele"}
                pendingLabel={editingKebele ? "Saving..." : "Adding..."}
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
            <DialogTitle>Filter kebeles</DialogTitle>
            <DialogDescription>Narrow the kebele list. Changes apply when you click Apply filters.</DialogDescription>
          </DialogHeader>
          <FieldGroup className={baseDataDialogFieldGroupClass}>
            <Field>
              <FieldLabel htmlFor="kebele-filter-zone">Zone</FieldLabel>
              <SelectField
                id="kebele-filter-zone"
                value={draftFilterZoneId}
                placeholder="All zones"
                options={zoneOptions}
                onValueChange={(value) => {
                  setDraftFilterZoneId(value);
                  setDraftFilterWoredaId("");
                }}
                className={inputClass}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="kebele-filter-woreda">Woreda</FieldLabel>
              <SelectField
                id="kebele-filter-woreda"
                value={draftFilterWoredaId}
                placeholder="All woredas"
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
              Clear filters
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
