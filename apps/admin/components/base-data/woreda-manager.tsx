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

export function WoredaManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [regionFilterId, setRegionFilterId] = useState("");
  const [zoneFilterId, setZoneFilterId] = useState("");
  const [editingWoreda, setEditingWoreda] = useState<Woreda | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingDeleteWoreda, setPendingDeleteWoreda] = useState<Woreda | null>(null);

  const regionsQuery = useRegionsQuery({ page: 1, pageSize: 100 });
  const zonesForCreateQuery = useZonesQuery({ page: 1, pageSize: 100 });
  const zonesForFilterQuery = useZonesQuery({
    page: 1,
    pageSize: 100,
    regionId: regionFilterId || undefined,
  });
  const woredasQuery = useWoredasQuery({
    page,
    pageSize: 10,
    searchQuery,
    regionId: regionFilterId || undefined,
    zoneId: zoneFilterId || undefined,
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
    () => (zonesForFilterQuery.data?.zones ?? []).map((z) => ({ value: z.id, label: z.name })),
    [zonesForFilterQuery.data?.zones]
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
            resetForm();
            setIsFormOpen(true);
          }}
          addLabel="Add woreda"
          showFilterButton
          onOpenFilters={() => setIsFilterOpen(true)}
          hasActiveFilters={Boolean(regionFilterId || zoneFilterId)}
        />
      </CardHeader>
      <CardContent>
        <TableShell headers={["Name", "Zone", "Description", "Actions"]} loading={woredasQuery.isLoading} loadingColumnCount={4} emptyState={<EmptyStateRow colSpan={4} message="No woredas found. Add your first woreda to get started." />}>
          {woredasQuery.data?.woredas?.map((woreda) => (
            <TableRow key={woreda.id}>
              <TableCell className="font-medium">{woreda.name}</TableCell>
              <TableCell>{woreda.zoneName}</TableCell>
              <TableCell className={descriptionCellClass}>{woreda.description || "---"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
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
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Woreda name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <textarea
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <SelectField value={selectedZoneId} placeholder="Select zone" options={zoneCreateOptions} onValueChange={setSelectedZoneId} />
            </div>
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

      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter woredas</DialogTitle>
            <DialogDescription>Apply filters to narrow down the woreda list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <SelectField
              value={regionFilterId}
              placeholder="All regions"
              options={regionFilterOptions}
              onValueChange={(value) => {
                setRegionFilterId(value);
                setZoneFilterId("");
                setPage(1);
              }}
            />
            <SelectField
              value={zoneFilterId}
              placeholder="All zones"
              options={zoneFilterOptions}
              onValueChange={(value) => {
                setZoneFilterId(value);
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
                setRegionFilterId("");
                setZoneFilterId("");
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
