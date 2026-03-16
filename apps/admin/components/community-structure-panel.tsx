"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sileo } from "sileo";

import {
  useCreateKebeleMutation,
  useCreateRegionMutation,
  useCreateReligionMutation,
  useCreateWoredaMutation,
  useCreateZoneMutation,
  useDeleteKebeleMutation,
  useDeleteReligionMutation,
  useDeleteRegionMutation,
  useDeleteWoredaMutation,
  useDeleteZoneMutation,
  useKebelesQuery,
  useReligionsQuery,
  useRegionsQuery,
  useUpdateKebeleMutation,
  useUpdateReligionMutation,
  useUpdateRegionMutation,
  useUpdateWoredaMutation,
  useUpdateZoneMutation,
  useWoredasQuery,
  useZonesQuery,
} from "@/hooks/use-base-data";
import type { Kebele, Region, Religion, Woreda, Zone } from "@/lib/api/base-data";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SectionKey = "region" | "zone" | "woreda" | "kebele" | "religion";

function ListLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="rounded-lg border border-primary/10 bg-card px-3 py-3"
        >
          <Skeleton className="mb-2 h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      ))}
    </div>
  );
}

const unifiedInputClass = "h-11 text-[0.95rem] md:text-base";
const NONE_SELECTED_VALUE = "__WEEMA_NONE__";

type SelectOption = {
  value: string;
  label: string;
};

function SelectField({
  value,
  onValueChange,
  options,
  className,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder: string;
}) {
  const selectValue = value || NONE_SELECTED_VALUE;

  return (
    <Select
      value={selectValue}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === NONE_SELECTED_VALUE ? "" : nextValue)
      }
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_SELECTED_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function RegionManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [pendingDeleteRegion, setPendingDeleteRegion] = useState<Region | null>(
    null
  );

  const regionsQuery = useRegionsQuery({ page, pageSize: 10, searchQuery });
  const createMutation = useCreateRegionMutation();
  const updateMutation = useUpdateRegionMutation();
  const deleteMutation = useDeleteRegionMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="self-start border-primary/10">
        <CardHeader>
          <CardTitle>{editingRegion ? "Update Region" : "Create Region"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingRegion && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
              Editing <span className="font-semibold">{editingRegion.name}</span>
            </p>
          )}
          <Input
            placeholder="Region name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={unifiedInputClass}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              className={editingRegion ? "flex-1 bg-[#415A9F] text-white hover:bg-[#384d88]" : "w-full bg-[#415A9F] text-white hover:bg-[#384d88]"}
              disabled={isSubmitting}
              onClick={async () => {
                if (!name.trim()) {
                  sileo.warning({
                    title: "Missing name",
                    description: "Region name is required.",
                  });
                  return;
                }

                try {
                  if (editingRegion) {
                    const result = await updateMutation.mutateAsync({
                      id: editingRegion.id,
                      payload: { name: name.trim(), description: description.trim() },
                    });
                    sileo.success({ title: "Updated", description: result.message });
                  } else {
                    const result = await createMutation.mutateAsync({
                      name: name.trim(),
                      description: description.trim(),
                    });
                    sileo.success({ title: "Created", description: result.message });
                  }
                  setName("");
                  setDescription("");
                  setEditingRegion(null);
                  setPage(1);
                } catch (error) {
                  sileo.error({
                    title: "Operation failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {editingRegion ? "Update Region" : "Create Region"}
            </Button>
            {editingRegion && (
              <Button
                variant="outline"
                className="flex-1 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => {
                  setEditingRegion(null);
                  setName("");
                  setDescription("");
                }}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Regions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search regions"
            value={searchQuery}
            className={`${unifiedInputClass} w-full max-w-sm`}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {regionsQuery.isLoading && <ListLoadingSkeleton />}
            {regionsQuery.data?.regions?.map((region) => (
              <div
                key={region.id}
                className="rounded-lg border border-primary/10 bg-card px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{region.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {region.description || "---"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRegion(region);
                        setName(region.name);
                        setDescription(region.description || "");
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPendingDeleteRegion(region)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!regionsQuery.isLoading &&
              (regionsQuery.data?.regions?.length ?? 0) === 0 && (
                <p className="rounded-md border border-dashed border-primary/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No regions found.
                </p>
              )}
          </div>
          {regionsQuery.data && (
            <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
              <p>
                Page {regionsQuery.data.currentPage} of {regionsQuery.data.totalPages} (
                {regionsQuery.data.totalElements} total)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={regionsQuery.data.currentPage <= 1}
                  onClick={() =>
                    setPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={regionsQuery.data.currentPage >= regionsQuery.data.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(regionsQuery.data?.totalPages ?? prev, prev + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!pendingDeleteRegion}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteRegion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Region</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteRegion?.name}
              </span>
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
                  const result = await deleteMutation.mutateAsync(
                    pendingDeleteRegion.id
                  );
                  sileo.success({ title: "Deleted", description: result.message });
                  setPendingDeleteRegion(null);
                } catch (error) {
                  sileo.error({
                    title: "Delete failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete region
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ZoneManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regionId, setRegionId] = useState("");
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [pendingDeleteZone, setPendingDeleteZone] = useState<Zone | null>(null);

  const regionsQuery = useRegionsQuery({ page: 1, pageSize: 100 });
  const zonesQuery = useZonesQuery({ page, pageSize: 10, searchQuery });

  const createMutation = useCreateZoneMutation();
  const updateMutation = useUpdateZoneMutation();
  const deleteMutation = useDeleteZoneMutation();

  const regionOptions = useMemo(
    () => regionsQuery.data?.regions ?? [],
    [regionsQuery.data?.regions]
  );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="self-start border-primary/10">
        <CardHeader>
          <CardTitle>{editingZone ? "Update Zone" : "Create Zone"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingZone && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
              Editing <span className="font-semibold">{editingZone.name}</span>
            </p>
          )}
          <Input
            placeholder="Zone name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={unifiedInputClass}
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
            options={regionOptions.map((region) => ({
              value: region.id,
              label: region.name,
            }))}
            onValueChange={setRegionId}
          />

          <div className="flex gap-2">
            <Button
              className={editingZone ? "flex-1 bg-[#415A9F] text-white hover:bg-[#384d88]" : "w-full bg-[#415A9F] text-white hover:bg-[#384d88]"}
              onClick={async () => {
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
                      },
                    });
                    sileo.success({ title: "Updated", description: result.message });
                  } else {
                    const result = await createMutation.mutateAsync({
                      name: name.trim(),
                      description: description.trim(),
                      regionId,
                    });
                    sileo.success({ title: "Created", description: result.message });
                  }
                  setName("");
                  setDescription("");
                  setRegionId("");
                  setEditingZone(null);
                  setPage(1);
                } catch (error) {
                  sileo.error({
                    title: "Operation failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {editingZone ? "Update Zone" : "Create Zone"}
            </Button>
            {editingZone && (
              <Button
                variant="outline"
                className="flex-1 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => {
                  setEditingZone(null);
                  setName("");
                  setDescription("");
                  setRegionId("");
                }}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Zones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search zones"
            value={searchQuery}
            className={`${unifiedInputClass} w-full max-w-sm`}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {zonesQuery.isLoading && <ListLoadingSkeleton />}
            {zonesQuery.data?.zones?.map((zone) => (
              <div
                key={zone.id}
                className="rounded-lg border border-primary/10 bg-card px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.regionName} - {zone.description || "---"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingZone(zone);
                        setName(zone.name);
                        setDescription(zone.description || "");
                        setRegionId(zone.regionId);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPendingDeleteZone(zone)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!zonesQuery.isLoading &&
              (zonesQuery.data?.zones?.length ?? 0) === 0 && (
                <p className="rounded-md border border-dashed border-primary/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No zones found.
                </p>
              )}
          </div>
          {zonesQuery.data && (
            <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
              <p>
                Page {zonesQuery.data.currentPage} of {zonesQuery.data.totalPages} (
                {zonesQuery.data.totalElements} total)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={zonesQuery.data.currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={zonesQuery.data.currentPage >= zonesQuery.data.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(zonesQuery.data?.totalPages ?? prev, prev + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!pendingDeleteZone}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteZone(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteZone?.name}
              </span>
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
                  const result = await deleteMutation.mutateAsync(
                    pendingDeleteZone.id
                  );
                  sileo.success({ title: "Deleted", description: result.message });
                  setPendingDeleteZone(null);
                } catch (error) {
                  sileo.error({
                    title: "Delete failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WoredaManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [regionFilterId, setRegionFilterId] = useState("");
  const [zoneFilterId, setZoneFilterId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [editingWoreda, setEditingWoreda] = useState<Woreda | null>(null);
  const [pendingDeleteWoreda, setPendingDeleteWoreda] = useState<Woreda | null>(
    null
  );

  const regionsQuery = useRegionsQuery({ page: 1, pageSize: 100 });
  const zonesForCreateQuery = useZonesQuery({
    page: 1,
    pageSize: 100,
  });
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

  const zoneCreateOptions = useMemo(
    () => zonesForCreateQuery.data?.zones ?? [],
    [zonesForCreateQuery.data?.zones]
  );
  const zoneFilterOptions = useMemo(
    () => zonesForFilterQuery.data?.zones ?? [],
    [zonesForFilterQuery.data?.zones]
  );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="self-start border-primary/10">
        <CardHeader>
          <CardTitle>{editingWoreda ? "Update Woreda" : "Create Woreda"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingWoreda && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
              Editing <span className="font-semibold">{editingWoreda.name}</span>
            </p>
          )}
          <Input
            placeholder="Woreda name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={unifiedInputClass}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <SelectField
            value={selectedZoneId}
            placeholder="Select zone"
            options={zoneCreateOptions.map((zone) => ({
              value: zone.id,
              label: zone.name,
            }))}
            onValueChange={setSelectedZoneId}
          />

          <div className="flex gap-2">
            <Button
              className={editingWoreda ? "flex-1 bg-[#415A9F] text-white hover:bg-[#384d88]" : "w-full bg-[#415A9F] text-white hover:bg-[#384d88]"}
              onClick={async () => {
                if (!name.trim() || !selectedZoneId) {
                  sileo.warning({
                    title: "Missing fields",
                    description: "Woreda name and zone are required.",
                  });
                  return;
                }
                try {
                  if (editingWoreda) {
                    const result = await updateMutation.mutateAsync({
                      id: editingWoreda.id,
                      payload: {
                        name: name.trim(),
                        description: description.trim(),
                        zoneId: selectedZoneId,
                      },
                    });
                    sileo.success({ title: "Updated", description: result.message });
                  } else {
                    const result = await createMutation.mutateAsync({
                      name: name.trim(),
                      description: description.trim(),
                      zoneId: selectedZoneId,
                    });
                    sileo.success({ title: "Created", description: result.message });
                  }
                  setName("");
                  setDescription("");
                  setSelectedZoneId("");
                  setEditingWoreda(null);
                  setPage(1);
                } catch (error) {
                  sileo.error({
                    title: "Operation failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {editingWoreda ? "Update Woreda" : "Create Woreda"}
            </Button>
            {editingWoreda && (
              <Button
                variant="outline"
                className="flex-1 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => {
                  setEditingWoreda(null);
                  setName("");
                  setDescription("");
                  setSelectedZoneId("");
                }}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Woredas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search woredas"
              value={searchQuery}
              className={`${unifiedInputClass} w-full max-w-sm`}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
            />
            <SelectField
              className="w-full sm:min-w-[180px]"
              value={regionFilterId}
              placeholder="All regions"
              options={(regionsQuery.data?.regions ?? []).map((region) => ({
                value: region.id,
                label: region.name,
              }))}
              onValueChange={(value) => {
                setRegionFilterId(value);
                setZoneFilterId("");
                setPage(1);
              }}
            />
            <SelectField
              className="w-full sm:min-w-[180px]"
              value={zoneFilterId}
              placeholder="All zones"
              options={zoneFilterOptions.map((zone) => ({
                value: zone.id,
                label: zone.name,
              }))}
              onValueChange={(value) => {
                setZoneFilterId(value);
                setPage(1);
              }}
            />
          </div>

          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {woredasQuery.isLoading && <ListLoadingSkeleton />}
            {woredasQuery.data?.woredas?.map((woreda) => (
              <div
                key={woreda.id}
                className="rounded-lg border border-primary/10 bg-card px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{woreda.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {woreda.zoneName} - {woreda.description || "---"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingWoreda(woreda);
                        setName(woreda.name);
                        setDescription(woreda.description || "");
                        setSelectedZoneId(woreda.zoneId);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPendingDeleteWoreda(woreda)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!woredasQuery.isLoading &&
              (woredasQuery.data?.woredas?.length ?? 0) === 0 && (
                <p className="rounded-md border border-dashed border-primary/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No woredas found.
                </p>
              )}
          </div>
          {woredasQuery.data && (
            <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
              <p>
                Page {woredasQuery.data.currentPage} of {woredasQuery.data.totalPages} (
                {woredasQuery.data.totalElements} total)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={woredasQuery.data.currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={woredasQuery.data.currentPage >= woredasQuery.data.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(woredasQuery.data?.totalPages ?? prev, prev + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDeleteWoreda}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteWoreda(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Woreda</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteWoreda?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteWoreda) return;
                try {
                  const result = await deleteMutation.mutateAsync(
                    pendingDeleteWoreda.id
                  );
                  sileo.success({ title: "Deleted", description: result.message });
                  setPendingDeleteWoreda(null);
                } catch (error) {
                  sileo.error({
                    title: "Delete failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete woreda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KebeleManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [zoneFilterId, setZoneFilterId] = useState("");
  const [woredaFilterId, setWoredaFilterId] = useState("");
  const [selectedWoredaId, setSelectedWoredaId] = useState("");
  const [editingKebele, setEditingKebele] = useState<Kebele | null>(null);
  const [pendingDeleteKebele, setPendingDeleteKebele] = useState<Kebele | null>(
    null
  );

  const zonesQuery = useZonesQuery({ page: 1, pageSize: 100 });
  const woredasForSelectQuery = useWoredasQuery({
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

  const woredaOptions = useMemo(
    () => woredasForSelectQuery.data?.woredas ?? [],
    [woredasForSelectQuery.data?.woredas]
  );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="self-start border-primary/10">
        <CardHeader>
          <CardTitle>{editingKebele ? "Update Kebele" : "Create Kebele"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingKebele && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
              Editing <span className="font-semibold">{editingKebele.name}</span>
            </p>
          )}
          <Input
            placeholder="Kebele name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={unifiedInputClass}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <SelectField
            value={selectedWoredaId}
            placeholder="Select woreda"
            options={woredaOptions.map((woreda) => ({
              value: woreda.id,
              label: woreda.name,
            }))}
            onValueChange={setSelectedWoredaId}
          />

          <div className="flex gap-2">
            <Button
              className={editingKebele ? "flex-1 bg-[#415A9F] text-white hover:bg-[#384d88]" : "w-full bg-[#415A9F] text-white hover:bg-[#384d88]"}
              onClick={async () => {
                if (!name.trim() || !selectedWoredaId) {
                  sileo.warning({
                    title: "Missing fields",
                    description: "Kebele name and woreda are required.",
                  });
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
                    sileo.success({ title: "Updated", description: result.message });
                  } else {
                    const result = await createMutation.mutateAsync({
                      name: name.trim(),
                      description: description.trim(),
                      woredaId: selectedWoredaId,
                    });
                    sileo.success({ title: "Created", description: result.message });
                  }
                  setName("");
                  setDescription("");
                  setSelectedWoredaId("");
                  setEditingKebele(null);
                  setPage(1);
                } catch (error) {
                  sileo.error({
                    title: "Operation failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {editingKebele ? "Update Kebele" : "Create Kebele"}
            </Button>
            {editingKebele && (
              <Button
                variant="outline"
                className="flex-1 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => {
                  setEditingKebele(null);
                  setName("");
                  setDescription("");
                  setSelectedWoredaId("");
                }}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Kebeles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search kebeles"
              value={searchQuery}
              className={`${unifiedInputClass} w-full max-w-sm`}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
            />
            <SelectField
              className="w-full sm:min-w-[180px]"
              value={zoneFilterId}
              placeholder="All zones"
              options={(zonesQuery.data?.zones ?? []).map((zone) => ({
                value: zone.id,
                label: zone.name,
              }))}
              onValueChange={(value) => {
                setZoneFilterId(value);
                setWoredaFilterId("");
                setPage(1);
              }}
            />
            <SelectField
              className="w-full sm:min-w-[180px]"
              value={woredaFilterId}
              placeholder="All woredas"
              options={woredaOptions.map((woreda) => ({
                value: woreda.id,
                label: woreda.name,
              }))}
              onValueChange={(value) => {
                setWoredaFilterId(value);
                setPage(1);
              }}
            />
          </div>

          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {kebelesQuery.isLoading && <ListLoadingSkeleton />}
            {kebelesQuery.data?.kebeles?.map((kebele) => (
              <div
                key={kebele.id}
                className="rounded-lg border border-primary/10 bg-card px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{kebele.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {kebele.woredaName} - {kebele.description || "---"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingKebele(kebele);
                        setName(kebele.name);
                        setDescription(kebele.description || "");
                        setSelectedWoredaId(kebele.woredaId);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPendingDeleteKebele(kebele)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!kebelesQuery.isLoading &&
              (kebelesQuery.data?.kebeles?.length ?? 0) === 0 && (
                <p className="rounded-md border border-dashed border-primary/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No kebeles found.
                </p>
              )}
          </div>
          {kebelesQuery.data && (
            <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
              <p>
                Page {kebelesQuery.data.currentPage} of {kebelesQuery.data.totalPages} (
                {kebelesQuery.data.totalElements} total)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={kebelesQuery.data.currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={kebelesQuery.data.currentPage >= kebelesQuery.data.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(kebelesQuery.data?.totalPages ?? prev, prev + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDeleteKebele}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteKebele(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Kebele</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteKebele?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteKebele) return;
                try {
                  const result = await deleteMutation.mutateAsync(
                    pendingDeleteKebele.id
                  );
                  sileo.success({ title: "Deleted", description: result.message });
                  setPendingDeleteKebele(null);
                } catch (error) {
                  sileo.error({
                    title: "Delete failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete kebele
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReligionManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingReligion, setEditingReligion] = useState<Religion | null>(null);
  const [pendingDeleteReligion, setPendingDeleteReligion] =
    useState<Religion | null>(null);

  const religionsQuery = useReligionsQuery({ page, pageSize: 10, searchQuery });
  const createMutation = useCreateReligionMutation();
  const updateMutation = useUpdateReligionMutation();
  const deleteMutation = useDeleteReligionMutation();

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="self-start border-primary/10">
        <CardHeader>
          <CardTitle>
            {editingReligion ? "Update Religion" : "Create Religion"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingReligion && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
              Editing <span className="font-semibold">{editingReligion.name}</span>
            </p>
          )}
          <Input
            placeholder="Religion name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={unifiedInputClass}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              className={editingReligion ? "flex-1 bg-[#415A9F] text-white hover:bg-[#384d88]" : "w-full bg-[#415A9F] text-white hover:bg-[#384d88]"}
              onClick={async () => {
                if (!name.trim()) {
                  sileo.warning({
                    title: "Missing name",
                    description: "Religion name is required.",
                  });
                  return;
                }
                try {
                  if (editingReligion) {
                    const result = await updateMutation.mutateAsync({
                      id: editingReligion.id,
                      payload: {
                        name: name.trim(),
                        description: description.trim(),
                      },
                    });
                    sileo.success({ title: "Updated", description: result.message });
                  } else {
                    const result = await createMutation.mutateAsync({
                      name: name.trim(),
                      description: description.trim(),
                    });
                    sileo.success({ title: "Created", description: result.message });
                  }
                  setName("");
                  setDescription("");
                  setEditingReligion(null);
                  setPage(1);
                } catch (error) {
                  sileo.error({
                    title: "Operation failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              {editingReligion ? "Update Religion" : "Create Religion"}
            </Button>
            {editingReligion && (
              <Button
                variant="outline"
                className="flex-1 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => {
                  setEditingReligion(null);
                  setName("");
                  setDescription("");
                }}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Religions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search religions"
            value={searchQuery}
            className={`${unifiedInputClass} w-full max-w-sm`}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {religionsQuery.isLoading && <ListLoadingSkeleton />}
            {religionsQuery.data?.religions?.map((religion) => (
              <div
                key={religion.id}
                className="rounded-lg border border-primary/10 bg-card px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{religion.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {religion.description || "---"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingReligion(religion);
                        setName(religion.name);
                        setDescription(religion.description || "");
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPendingDeleteReligion(religion)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!religionsQuery.isLoading &&
              (religionsQuery.data?.religions?.length ?? 0) === 0 && (
                <p className="rounded-md border border-dashed border-primary/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No religions found.
                </p>
              )}
          </div>
          {religionsQuery.data && (
            <div className="flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
              <p>
                Page {religionsQuery.data.currentPage} of {religionsQuery.data.totalPages} (
                {religionsQuery.data.totalElements} total)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={religionsQuery.data.currentPage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    religionsQuery.data.currentPage >= religionsQuery.data.totalPages
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(religionsQuery.data?.totalPages ?? prev, prev + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDeleteReligion}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteReligion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Religion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteReligion?.name}
              </span>
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
                  const result = await deleteMutation.mutateAsync(
                    pendingDeleteReligion.id
                  );
                  sileo.success({ title: "Deleted", description: result.message });
                  setPendingDeleteReligion(null);
                } catch (error) {
                  sileo.error({
                    title: "Delete failed",
                    description:
                      error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete religion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CommunityStructurePanel() {
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") ?? "region") as SectionKey;

  if (section === "region") return <RegionManager />;
  if (section === "zone") return <ZoneManager />;
  if (section === "woreda") return <WoredaManager />;
  if (section === "kebele") return <KebeleManager />;
  if (section === "religion") return <ReligionManager />;
  return <RegionManager />;
}

