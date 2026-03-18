"use client";

import { FormEvent, useState } from "react";
import { EyeIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useClustersQuery,
  useCreateSHGMutation,
  useDeleteSHGMutation,
  useSHGDetailQuery,
  useSHGsQuery,
  useUpdateSHGMutation,
} from "@/hooks/use-community";
import { useKebelesQuery, useWoredasQuery } from "@/hooks/use-base-data";
import type { EntityStatus, SHG } from "@/lib/api/community";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { SelectField } from "@/components/base-data/select-field";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function StatusBadge({ status }: { status: EntityStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </Badge>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{value ?? <span className="text-muted-foreground/50">—</span>}</dd>
    </>
  );
}

function SHGDetailDialog({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useSHGDetailQuery(id);
  const shg = data?.selfHelpGroup;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shg?.name ?? "Self-help group details"}</DialogTitle>
          <DialogDescription>Full details for this self-help group.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : shg ? (
            <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3.5">
              <DetailField label="Name" value={shg.name} />
              <DetailField label="Location" value={shg.location} />
              <DetailField label="Status" value={<StatusBadge status={shg.status} />} />
              <DetailField label="Woreda" value={shg.woredaName} />
              <DetailField label="Kebele" value={shg.kebeleName} />
              <DetailField label="Cluster" value={shg.clusterName} />
              <DetailField label="Facilitator" value={shg.facilitatorName} />
              <DetailField label="Members" value={shg.memberCount} />
              <DetailField
                label="Coordinates"
                value={
                  shg.latitude != null && shg.longitude != null
                    ? `${shg.latitude}, ${shg.longitude}`
                    : null
                }
              />
              <DetailField label="Description" value={shg.description} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load details.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AreaLabel({ shg }: { shg: SHG }) {
  if (shg.kebeleName) return <>{shg.kebeleName}</>;
  if (shg.woredaName) return <>{shg.woredaName}</>;
  return <span className="text-muted-foreground/60 text-xs">—</span>;
}

export function SHGManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [woredaId, setWoredaId] = useState("");
  const [kebeleId, setKebeleId] = useState("");
  const [clusterId, setClusterId] = useState("");
  const [editingSHG, setEditingSHG] = useState<SHG | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SHG | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const shgsQuery = useSHGsQuery({ page, pageSize: 10, searchQuery });
  const woredasQuery = useWoredasQuery({ pageSize: 200 });
  const kebelesQuery = useKebelesQuery({ pageSize: 200 });
  const clustersQuery = useClustersQuery({ pageSize: 200 });
  const createMutation = useCreateSHGMutation();
  const updateMutation = useUpdateSHGMutation();
  const deleteMutation = useDeleteSHGMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const woredaOptions =
    woredasQuery.data?.woredas?.map((w) => ({ value: w.id, label: w.name })) ?? [];
  const kebeleOptions =
    kebelesQuery.data?.kebeles?.map((k) => ({ value: k.id, label: k.name })) ?? [];
  const clusterOptions =
    clustersQuery.data?.clusters?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  const resetForm = () => {
    setName(""); setDescription(""); setLocation("");
    setLatitude(""); setLongitude(""); setStatus("ACTIVE");
    setWoredaId(""); setKebeleId(""); setClusterId("");
    setEditingSHG(null);
  };

  const openCreate = () => { resetForm(); setIsFormOpen(true); };

  const openEdit = (shg: SHG) => {
    setEditingSHG(shg);
    setName(shg.name);
    setDescription(shg.description || "");
    setLocation(shg.location || "");
    setLatitude(shg.latitude != null ? String(shg.latitude) : "");
    setLongitude(shg.longitude != null ? String(shg.longitude) : "");
    setStatus(shg.status);
    setWoredaId(shg.woredaId || "");
    setKebeleId(shg.kebeleId || "");
    setClusterId(shg.clusterId || "");
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      sileo.warning({ title: "Missing name", description: "Self-help group name is required." });
      return;
    }

    const parsedLat = latitude !== "" ? parseFloat(latitude) : null;
    const parsedLng = longitude !== "" ? parseFloat(longitude) : null;

    try {
      if (editingSHG) {
        const result = await updateMutation.mutateAsync({
          id: editingSHG.id,
          payload: {
            name: name.trim(), description: description.trim(),
            location: location.trim(), latitude: parsedLat, longitude: parsedLng,
            status, woredaId: woredaId || null, kebeleId: kebeleId || null,
            clusterId: clusterId || null,
          },
        });
        sileo.success({ title: "SHG updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(), description: description.trim(),
          location: location.trim(), latitude: parsedLat, longitude: parsedLng,
          status, woredaId: woredaId || null, kebeleId: kebeleId || null,
        });
        sileo.success({ title: "SHG added", description: result.message });
      }

      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save self-help group",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Self-Help Groups</CardTitle>
        <DataToolbar
          searchPlaceholder="Search self-help groups"
          searchValue={searchQuery}
          onSearchChange={(value) => { setSearchQuery(value); setPage(1); }}
          onAdd={openCreate}
          addLabel="Add SHG"
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Area", "Cluster", "Members", "Status", "Actions"]}
          loading={shgsQuery.isLoading}
          loadingColumnCount={6}
          emptyState={
            <EmptyStateRow colSpan={6} message="No self-help groups found. Add your first SHG to get started." />
          }
        >
          {shgsQuery.data?.selfHelpGroups?.map((shg) => (
            <TableRow key={shg.id}>
              <TableCell className="font-medium">{shg.name}</TableCell>
              <TableCell className={descriptionCellClass}><AreaLabel shg={shg} /></TableCell>
              <TableCell className="text-muted-foreground">
                {shg.clusterName ?? <span className="text-muted-foreground/60 text-xs">Unassigned</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{shg.memberCount}</TableCell>
              <TableCell><StatusBadge status={shg.status} /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setViewingId(shg.id)}>
                    <EyeIcon className="size-3.5" />
                    View
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(shg)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDelete(shg)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {shgsQuery.data && (
          <PaginationRow
            currentPage={shgsQuery.data.currentPage}
            totalPages={shgsQuery.data.totalPages}
            totalElements={shgsQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(shgsQuery.data?.totalPages ?? prev, prev + 1))}
          />
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingSHG ? "Edit self-help group" : "Add self-help group"}</DialogTitle>
              <DialogDescription>
                {editingSHG
                  ? "Update self-help group details, then save your changes."
                  : "Add a new self-help group to the community structure."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputClass} step="any" />
                <Input type="number" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputClass} step="any" />
              </div>
              <SelectField
                value={woredaId}
                onValueChange={(v) => { setWoredaId(v); if (v) setKebeleId(""); }}
                options={woredaOptions}
                placeholder="Assign to woreda (optional)"
                className="h-11"
              />
              <SelectField
                value={kebeleId}
                onValueChange={(v) => { setKebeleId(v); if (v) setWoredaId(""); }}
                options={kebeleOptions}
                placeholder="Assign to kebele (optional)"
                className="h-11"
              />
              {editingSHG && (
                <SelectField value={clusterId} onValueChange={setClusterId} options={clusterOptions} placeholder="Assign to cluster (optional)" className="h-11" />
              )}
              <SelectField value={status} onValueChange={(v) => setStatus(v as EntityStatus)} options={STATUS_OPTIONS} placeholder="Status" className="h-11" />
              <textarea
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <SaveButton
                isPending={isSubmitting}
                idleLabel={editingSHG ? "Save group" : "Add group"}
                pendingLabel={editingSHG ? "Saving..." : "Adding..."}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SHGDetailDialog
        id={viewingId}
        open={!!viewingId}
        onClose={() => setViewingId(null)}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete self-help group</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  const result = await deleteMutation.mutateAsync(pendingDelete.id);
                  sileo.success({ title: "SHG deleted", description: result.message });
                  setPendingDelete(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete SHG",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
