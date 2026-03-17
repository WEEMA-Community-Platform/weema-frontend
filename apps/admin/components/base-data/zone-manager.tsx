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

export function ZoneManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regionId, setRegionId] = useState("");
  const [specialWoreda, setSpecialWoreda] = useState<boolean | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteZone, setPendingDeleteZone] = useState<Zone | null>(null);

  const regionsQuery = useRegionsQuery({ page: 1, pageSize: 100 });
  const zonesQuery = useZonesQuery({ page, pageSize: 10, searchQuery });

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
    setSpecialWoreda(null);
    setEditingZone(null);
  };

  const submitForm = async (event: FormEvent) => {
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
            specialWoreda,
          },
        });
        sileo.success({ title: "Zone updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          regionId,
          specialWoreda,
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
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel="Add zone"
        />
      </CardHeader>
      <CardContent>
        <TableShell headers={["Name", "Region", "Special Woreda", "Description", "Actions"]} loading={zonesQuery.isLoading} loadingColumnCount={5} emptyState={<EmptyStateRow colSpan={5} message="No zones found. Add your first zone to get started." />}>
          {zonesQuery.data?.zones?.map((zone) => (
            <TableRow key={zone.id}>
              <TableCell className="font-medium">{zone.name}</TableCell>
              <TableCell>{zone.regionName}</TableCell>
              <TableCell>
                {zone.specialWoreda === null || zone.specialWoreda === undefined
                  ? "---"
                  : zone.specialWoreda
                    ? "Yes"
                    : "No"}
              </TableCell>
              <TableCell className={descriptionCellClass}>{zone.description || "---"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingZone(zone);
                      setName(zone.name);
                      setDescription(zone.description || "");
                      setRegionId(zone.regionId);
                      setSpecialWoreda(zone.specialWoreda ?? null);
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
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input
                placeholder="Zone name"
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
              <SelectField
                value={regionId}
                placeholder="Select region"
                options={regionOptions}
                onValueChange={setRegionId}
              />
              <SelectField
                value={
                  specialWoreda === null
                    ? ""
                    : specialWoreda
                      ? "true"
                      : "false"
                }
                placeholder="Special woreda flag"
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
                onValueChange={(value) => {
                  if (value === "true") {
                    setSpecialWoreda(true);
                    return;
                  }
                  if (value === "false") {
                    setSpecialWoreda(false);
                    return;
                  }
                  setSpecialWoreda(null);
                }}
              />
            </div>
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
