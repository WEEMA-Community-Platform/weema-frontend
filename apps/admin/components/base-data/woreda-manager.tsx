"use client";

import { FormEvent, useMemo, useState } from "react";
import { sileo } from "sileo";

import {
  useCreateWoredaMutation,
  useDeleteWoredaMutation,
  useRegionsQuery,
  useUpdateWoredaMutation,
  useWoredasQuery,
  useZonesQuery,
} from "@/hooks/use-base-data";
import type { Woreda } from "@/lib/api/base-data";
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

export function WoredaManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [appliedFilterRegionId, setAppliedFilterRegionId] = useState("");
  const [appliedFilterZoneId, setAppliedFilterZoneId] = useState("");
  const [draftFilterRegionId, setDraftFilterRegionId] = useState("");
  const [draftFilterZoneId, setDraftFilterZoneId] = useState("");
  const [editingWoreda, setEditingWoreda] = useState<Woreda | null>(null);
  const [viewingWoreda, setViewingWoreda] = useState<Woreda | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingDeleteWoreda, setPendingDeleteWoreda] = useState<Woreda | null>(null);

  const regionsQuery = useRegionsQuery({ page: 1, pageSize: 100 });
  const zonesForCreateQuery = useZonesQuery({ page: 1, pageSize: 100 });
  const zonesForFilterDraftQuery = useZonesQuery({
    page: 1,
    pageSize: 100,
    regionId: draftFilterRegionId || undefined,
  });
  const woredasQuery = useWoredasQuery({
    page,
    pageSize: 10,
    searchQuery,
    regionId: appliedFilterRegionId || undefined,
    zoneId: appliedFilterZoneId || undefined,
  });

  const createMutation = useCreateWoredaMutation();
  const updateMutation = useUpdateWoredaMutation();
  const deleteMutation = useDeleteWoredaMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const zoneCreateOptions = useMemo(
    () => (zonesForCreateQuery.data?.zones ?? []).map((z) => ({ value: z.id, label: z.name })),
    [zonesForCreateQuery.data?.zones]
  );
  const regionFilterOptions = useMemo(
    () => (regionsQuery.data?.regions ?? []).map((r) => ({ value: r.id, label: r.name })),
    [regionsQuery.data?.regions]
  );
  const zoneFilterOptions = useMemo(
    () => (zonesForFilterDraftQuery.data?.zones ?? []).map((z) => ({ value: z.id, label: z.name })),
    [zonesForFilterDraftQuery.data?.zones]
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedZoneId("");
    setEditingWoreda(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !selectedZoneId) {
      sileo.warning({ title: "Missing fields", description: "Woreda name and zone are required." });
      return;
    }

    try {
      if (editingWoreda) {
        const result = await updateMutation.mutateAsync({
          id: editingWoreda.id,
          payload: { name: name.trim(), description: description.trim(), zoneId: selectedZoneId },
        });
        sileo.success({ title: "Woreda updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          zoneId: selectedZoneId,
        });
        sileo.success({ title: "Woreda added", description: result.message });
      }
      setIsFormOpen(false);
      setPage(1);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save woreda",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(appliedFilterRegionId || appliedFilterZoneId);
  const woredasEmptyMessage = listEmptyMessage({
    entityPlural: "woredas",
    hasSearch,
    hasFilters,
    emptyCatalogHint: "No woredas yet. Add your first woreda to get started.",
  });

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Woredas</CardTitle>
        <DataToolbar
          searchPlaceholder="Search woredas"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onAdd={() => {
            setViewingWoreda(null);
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel="Add woreda"
          showFilterButton
          onOpenFilters={() => setIsFilterOpen(true)}
          hasActiveFilters={hasFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Zone", "Description", "Actions"]}
          loading={woredasQuery.isLoading}
          loadingColumnCount={4}
          isError={woredasQuery.isError}
          errorMessage={woredasQuery.error instanceof Error ? woredasQuery.error.message : undefined}
          onRetry={woredasQuery.refetch}
          emptyState={<EmptyStateRow colSpan={4} message={woredasEmptyMessage} />}
        >
          {woredasQuery.data?.woredas?.map((woreda) => (
            <TableRow key={woreda.id}>
              <TableCell className="align-top font-medium">{woreda.name}</TableCell>
              <TableCell className="align-top">{woreda.zoneName}</TableCell>
              <DescriptionTableCell
                description={woreda.description}
                onView={() => {
                  setIsFormOpen(false);
                  setViewingWoreda(woreda);
                }}
              />
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewingWoreda(null);
                      setEditingWoreda(woreda);
                      setName(woreda.name);
                      setDescription(woreda.description || "");
                      setSelectedZoneId(woreda.zoneId);
                      setIsFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteWoreda(woreda)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {woredasQuery.data && (
          <PaginationRow
            currentPage={woredasQuery.data.currentPage}
            totalPages={woredasQuery.data.totalPages}
            totalElements={woredasQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(woredasQuery.data.totalPages, prev + 1))}
          />
        )}
      </CardContent>

      <Dialog
        open={!!viewingWoreda}
        onOpenChange={(open) => {
          if (!open) setViewingWoreda(null);
        }}
      >
        <DialogContent>
          <div className="flex max-h-[85vh] flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>View woreda</DialogTitle>
              <DialogDescription>Read-only details for this woreda.</DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="woreda-name-view">Woreda name</FieldLabel>
                <Input
                  id="woreda-name-view"
                  readOnly
                  value={viewingWoreda?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="woreda-zone-view">Zone</FieldLabel>
                <SelectField
                  id="woreda-zone-view"
                  value={viewingWoreda?.zoneId ?? ""}
                  placeholder="Select zone"
                  options={zoneCreateOptions}
                  onValueChange={() => {}}
                  className={viewReadOnlyInputClass}
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="woreda-description-view">Description</FieldLabel>
                <textarea
                  id="woreda-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingWoreda?.description ?? ""}
                  placeholder="Optional details"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingWoreda(null)}>
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
              <DialogTitle>{editingWoreda ? "Edit woreda" : "Add woreda"}</DialogTitle>
              <DialogDescription>
                {editingWoreda
                  ? "Update woreda details, then save your changes."
                  : "Add a new woreda to your base data list."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="woreda-name">Woreda name</FieldLabel>
                <Input
                  id="woreda-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="woreda-zone">Zone</FieldLabel>
                <SelectField
                  id="woreda-zone"
                  value={selectedZoneId}
                  placeholder="Select zone"
                  options={zoneCreateOptions}
                  onValueChange={setSelectedZoneId}
                  className={inputClass}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="woreda-description">Description</FieldLabel>
                <textarea
                  id="woreda-description"
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
                idleLabel={editingWoreda ? "Save woreda" : "Add woreda"}
                pendingLabel={editingWoreda ? "Saving..." : "Adding..."}
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
            setDraftFilterRegionId(appliedFilterRegionId);
            setDraftFilterZoneId(appliedFilterZoneId);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter woredas</DialogTitle>
            <DialogDescription>Narrow the woreda list. Changes apply when you click Apply filters.</DialogDescription>
          </DialogHeader>
          <FieldGroup className={baseDataDialogFieldGroupClass}>
            <Field>
              <FieldLabel htmlFor="woreda-filter-region">Region</FieldLabel>
              <SelectField
                id="woreda-filter-region"
                value={draftFilterRegionId}
                placeholder="All regions"
                options={regionFilterOptions}
                onValueChange={(value) => {
                  setDraftFilterRegionId(value);
                  setDraftFilterZoneId("");
                }}
                className={inputClass}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="woreda-filter-zone">Zone</FieldLabel>
              <SelectField
                id="woreda-filter-zone"
                value={draftFilterZoneId}
                placeholder="All zones"
                options={zoneFilterOptions}
                onValueChange={setDraftFilterZoneId}
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
                setAppliedFilterRegionId("");
                setAppliedFilterZoneId("");
                setDraftFilterRegionId("");
                setDraftFilterZoneId("");
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
                setAppliedFilterRegionId(draftFilterRegionId);
                setAppliedFilterZoneId(draftFilterZoneId);
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
        open={!!pendingDeleteWoreda}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteWoreda(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete woreda</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{pendingDeleteWoreda?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteWoreda) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteWoreda.id);
                  sileo.success({ title: "Woreda deleted", description: result.message });
                  setPendingDeleteWoreda(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete woreda",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete woreda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
