"use client";

import { FormEvent, useMemo, useState } from "react";
import { sileo } from "sileo";

import {
  useCreateZoneMutation,
  useDeleteZoneMutation,
  useRegionsQuery,
  useUpdateZoneMutation,
  useZonesQuery,
} from "@/hooks/use-base-data";
import type { Zone } from "@/lib/api/base-data";
import { cn } from "@/lib/utils";
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

/** Normalize API values (boolean, string, number) so edit state matches the server. */
function coerceSpecialWoreda(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function zoneSpecialWoredaRaw(zone: Zone): unknown {
  return zone.isSpecialWoreda ?? zone.specialWoreda;
}

export function ZoneManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [appliedFilterRegionId, setAppliedFilterRegionId] = useState("");
  const [draftFilterRegionId, setDraftFilterRegionId] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regionId, setRegionId] = useState("");
  /** Always a boolean so PATCH sends true/false reliably (no Select empty/false confusion). */
  const [isSpecialWoreda, setIsSpecialWoreda] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [viewingZone, setViewingZone] = useState<Zone | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteZone, setPendingDeleteZone] = useState<Zone | null>(null);

  const regionsQuery = useRegionsQuery({ page: 1, pageSize: 100 });
  const zonesQuery = useZonesQuery({
    page,
    pageSize: 10,
    searchQuery,
    regionId: appliedFilterRegionId || undefined,
  });

  const createMutation = useCreateZoneMutation();
  const updateMutation = useUpdateZoneMutation();
  const deleteMutation = useDeleteZoneMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const regionOptions = useMemo(
    () =>
      (regionsQuery.data?.regions ?? []).map((region) => ({
        value: region.id,
        label: region.name,
      })),
    [regionsQuery.data?.regions]
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setRegionId("");
    setIsSpecialWoreda(false);
    setEditingZone(null);
  };

  const hasSearch = Boolean(searchQuery.trim());
  const hasFilters = Boolean(appliedFilterRegionId);
  const zonesEmptyMessage = listEmptyMessage({
    entityPlural: "zones",
    hasSearch,
    hasFilters,
    emptyCatalogHint: "No zones yet. Add your first zone to get started.",
  });

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !regionId) {
      sileo.warning({
        title: "Missing fields",
        description: "Zone name and region are required.",
      });
      return;
    }

    try {
      if (editingZone) {
        const result = await updateMutation.mutateAsync({
          id: editingZone.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            regionId,
            isSpecialWoreda,
          },
        });
        sileo.success({ title: "Zone updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          regionId,
          isSpecialWoreda,
        });
        sileo.success({ title: "Zone added", description: result.message });
      }

      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save zone",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Zones</CardTitle>
        <DataToolbar
          searchPlaceholder="Search zones"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onAdd={() => {
            setViewingZone(null);
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel="Add zone"
          showFilterButton
          onOpenFilters={() => setIsFilterOpen(true)}
          hasActiveFilters={hasFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Region", "Special Woreda", "Description", "Actions"]}
          loading={zonesQuery.isLoading}
          loadingColumnCount={5}
          isError={zonesQuery.isError}
          errorMessage={zonesQuery.error instanceof Error ? zonesQuery.error.message : undefined}
          onRetry={zonesQuery.refetch}
          emptyState={<EmptyStateRow colSpan={5} message={zonesEmptyMessage} />}
        >
          {zonesQuery.data?.zones?.map((zone) => (
            <TableRow key={zone.id}>
              <TableCell className="align-top font-medium">{zone.name}</TableCell>
              <TableCell className="align-top">{zone.regionName}</TableCell>
              <TableCell className="align-top">
                {(() => {
                  const raw = zoneSpecialWoredaRaw(zone);
                  return raw === null || raw === undefined
                    ? "---"
                    : coerceSpecialWoreda(raw)
                      ? "Yes"
                      : "No";
                })()}
              </TableCell>
              <DescriptionTableCell description={zone.description} />
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setViewingZone(zone);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewingZone(null);
                      setEditingZone(zone);
                      setName(zone.name);
                      setDescription(zone.description || "");
                      setRegionId(zone.regionId);
                      setIsSpecialWoreda(coerceSpecialWoreda(zoneSpecialWoredaRaw(zone)));
                      setIsFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDeleteZone(zone)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {zonesQuery.data && (
          <PaginationRow
            currentPage={zonesQuery.data.currentPage}
            totalPages={zonesQuery.data.totalPages}
            totalElements={zonesQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(zonesQuery.data.totalPages, prev + 1))}
          />
        )}
      </CardContent>

      <Dialog
        open={isFilterOpen}
        onOpenChange={(open) => {
          setIsFilterOpen(open);
          if (open) setDraftFilterRegionId(appliedFilterRegionId);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter zones</DialogTitle>
            <DialogDescription>Narrow the list by region. Changes apply when you click Apply filters.</DialogDescription>
          </DialogHeader>
          <FieldGroup className={baseDataDialogFieldGroupClass}>
            <Field>
              <FieldLabel htmlFor="zone-filter-region">Region</FieldLabel>
              <SelectField
                id="zone-filter-region"
                value={draftFilterRegionId}
                placeholder="All regions"
                options={regionOptions}
                onValueChange={setDraftFilterRegionId}
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
                setDraftFilterRegionId("");
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
                setPage(1);
                setIsFilterOpen(false);
              }}
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingZone}
        onOpenChange={(open) => {
          if (!open) setViewingZone(null);
        }}
      >
        <DialogContent>
          <div className="flex max-h-[85vh] flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>View zone</DialogTitle>
              <DialogDescription>Read-only details for this zone.</DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="zone-name-view">Zone name</FieldLabel>
                <Input
                  id="zone-name-view"
                  readOnly
                  value={viewingZone?.name ?? ""}
                  className={viewReadOnlyInputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="zone-region-view">Region</FieldLabel>
                <SelectField
                  id="zone-region-view"
                  value={viewingZone?.regionId ?? ""}
                  placeholder="Select region"
                  options={regionOptions}
                  onValueChange={() => {}}
                  className={viewReadOnlyInputClass}
                  disabled
                />
              </Field>
              <div className="pointer-events-none flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-3 opacity-80">
                <div className="space-y-0.5">
                  <FieldLabel htmlFor="zone-special-woreda-view" className="cursor-default">
                    Is this a special woreda?
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Enable only for zones that count as a special woreda in the program.
                  </p>
                </div>
                <div
                  id="zone-special-woreda-view"
                  role="switch"
                  aria-checked={
                    viewingZone ? coerceSpecialWoreda(zoneSpecialWoredaRaw(viewingZone)) : false
                  }
                  aria-readonly="true"
                  className={[
                    "relative inline-flex h-7 w-12 shrink-0 rounded-full border border-transparent",
                    viewingZone && coerceSpecialWoreda(zoneSpecialWoredaRaw(viewingZone))
                      ? "bg-primary"
                      : "bg-muted",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "pointer-events-none block size-6 translate-x-0.5 rounded-full bg-background shadow-sm ring-0 transition-transform",
                      viewingZone && coerceSpecialWoreda(zoneSpecialWoredaRaw(viewingZone))
                        ? "translate-x-5"
                        : "translate-x-0",
                    ].join(" ")}
                  />
                </div>
              </div>
              <Field>
                <FieldLabel htmlFor="zone-description-view">Description</FieldLabel>
                <textarea
                  id="zone-description-view"
                  readOnly
                  className={viewReadOnlyTextareaClass}
                  value={viewingZone?.description ?? ""}
                  placeholder="Optional details"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setViewingZone(null)}>
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
              <DialogTitle>{editingZone ? "Edit zone" : "Add zone"}</DialogTitle>
              <DialogDescription>
                {editingZone
                  ? "Update zone details, then save your changes."
                  : "Add a new zone to your base data list."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className={baseDataDialogFieldGroupClass}>
              <Field>
                <FieldLabel htmlFor="zone-name">Zone name</FieldLabel>
                <Input
                  id="zone-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="zone-region">Region</FieldLabel>
                <SelectField
                  id="zone-region"
                  value={regionId}
                  placeholder="Select region"
                  options={regionOptions}
                  onValueChange={setRegionId}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-3">
                <div className="space-y-0.5">
                  <label
                    htmlFor="zone-special-woreda"
                    id="zone-special-woreda-label"
                    className="block cursor-pointer text-sm leading-none font-medium"
                  >
                    Is this a special woreda?
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Enable only for zones that count as a special woreda in the program.
                  </p>
                </div>
                <label
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background focus-within:outline-none",
                    isSpecialWoreda ? "bg-primary" : "bg-muted"
                  )}
                >
                  <input
                    id="zone-special-woreda"
                    type="checkbox"
                    role="switch"
                    checked={isSpecialWoreda}
                    onChange={(event) => setIsSpecialWoreda(event.target.checked)}
                    className="peer sr-only"
                    aria-labelledby="zone-special-woreda-label"
                  />
                  <span
                    className={cn(
                      "pointer-events-none block size-6 translate-x-0.5 rounded-full bg-background shadow-sm ring-0 transition-transform",
                      isSpecialWoreda ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </label>
              </div>
              <Field>
                <FieldLabel htmlFor="zone-description">Description</FieldLabel>
                <textarea
                  id="zone-description"
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
                idleLabel={editingZone ? "Save zone" : "Add zone"}
                pendingLabel={editingZone ? "Saving..." : "Adding..."}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteZone}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteZone(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete zone</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{pendingDeleteZone?.name}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteZone) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDeleteZone.id);
                  sileo.success({ title: "Zone deleted", description: result.message });
                  setPendingDeleteZone(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete zone",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
