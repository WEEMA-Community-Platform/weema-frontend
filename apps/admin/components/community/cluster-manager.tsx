"use client";

import { FormEvent, useState } from "react";
import { EyeIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useClusterDetailQuery,
  useCreateClusterMutation,
  useDeleteClusterMutation,
  useClustersQuery,
  useFederationsQuery,
  useUpdateClusterMutation,
} from "@/hooks/use-community";
import { useCurrentUser } from "@/hooks/use-user";
import { useWoredasQuery } from "@/hooks/use-base-data";
import type { Cluster, EntityStatus } from "@/lib/api/community";
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

function ClusterDetailDialog({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useClusterDetailQuery(id);
  const cluster = data?.cluster;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cluster?.name ?? "Cluster details"}</DialogTitle>
          <DialogDescription>Full details for this cluster.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : cluster ? (
            <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3.5">
              <DetailField label="Name" value={cluster.name} />
              <DetailField label="Location" value={cluster.location} />
              <DetailField label="Status" value={<StatusBadge status={cluster.status} />} />
              <DetailField label="Woreda" value={cluster.woredaName} />
              <DetailField label="Federation" value={cluster.federationName} />
              <DetailField label="Manager" value={cluster.managerName} />
              <DetailField label="Self-Help Groups" value={cluster.selfHelpGroupCount} />
              <DetailField label="Description" value={cluster.description} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load details.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ClusterManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [woredaId, setWoredaId] = useState("");
  const [federationId, setFederationId] = useState("");
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Cluster | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const clustersQuery = useClustersQuery({ page, pageSize: 10, searchQuery });
  const woredasQuery = useWoredasQuery({ pageSize: 200 });
  const federationsQuery = useFederationsQuery({ pageSize: 200 });
  const { data: currentUserData } = useCurrentUser();
  const createMutation = useCreateClusterMutation();
  const updateMutation = useUpdateClusterMutation();
  const deleteMutation = useDeleteClusterMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const woredaOptions =
    woredasQuery.data?.woredas?.map((w) => ({ value: w.id, label: w.name })) ?? [];
  const federationOptions =
    federationsQuery.data?.federations?.map((f) => ({ value: f.id, label: f.name })) ?? [];

  const resetForm = () => {
    setName("");
    setDescription("");
    setLocation("");
    setStatus("ACTIVE");
    setWoredaId("");
    setFederationId("");
    setEditingCluster(null);
  };

  const openCreate = () => { resetForm(); setIsFormOpen(true); };

  const openEdit = (cluster: Cluster) => {
    setEditingCluster(cluster);
    setName(cluster.name);
    setDescription(cluster.description || "");
    setLocation(cluster.location || "");
    setStatus(cluster.status);
    setWoredaId(cluster.woredaId || "");
    setFederationId(cluster.federationId || "");
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      sileo.warning({ title: "Missing name", description: "Cluster name is required." });
      return;
    }
    if (!woredaId) {
      sileo.warning({ title: "Missing woreda", description: "Please select a woreda." });
      return;
    }

    const managerId = currentUserData?.user?.id;

    try {
      if (editingCluster) {
        const result = await updateMutation.mutateAsync({
          id: editingCluster.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            location: location.trim(),
            status,
            woredaId,
            federationId: federationId || null,
            ...(managerId ? { managerId } : {}),
          },
        });
        sileo.success({ title: "Cluster updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          status,
          woredaId,
          federationId: federationId || null,
          ...(managerId ? { managerId } : {}),
        });
        sileo.success({ title: "Cluster added", description: result.message });
      }

      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save cluster",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Clusters</CardTitle>
        <DataToolbar
          searchPlaceholder="Search clusters"
          searchValue={searchQuery}
          onSearchChange={(value) => { setSearchQuery(value); setPage(1); }}
          onAdd={openCreate}
          addLabel="Add cluster"
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Woreda", "Federation", "Status", "SHGs", "Actions"]}
          loading={clustersQuery.isLoading}
          loadingColumnCount={6}
          emptyState={
            <EmptyStateRow colSpan={6} message="No clusters found. Add your first cluster to get started." />
          }
        >
          {clustersQuery.data?.clusters?.map((cluster) => (
            <TableRow key={cluster.id}>
              <TableCell className="font-medium">{cluster.name}</TableCell>
              <TableCell className={descriptionCellClass}>{cluster.woredaName || "---"}</TableCell>
              <TableCell className="text-muted-foreground">
                {cluster.federationName ?? <span className="text-muted-foreground/60 text-xs">Unassigned</span>}
              </TableCell>
              <TableCell><StatusBadge status={cluster.status} /></TableCell>
              <TableCell className="text-muted-foreground">{cluster.selfHelpGroupCount}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setViewingId(cluster.id)}>
                    <EyeIcon className="size-3.5" />
                    View
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(cluster)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDelete(cluster)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {clustersQuery.data && (
          <PaginationRow
            currentPage={clustersQuery.data.currentPage}
            totalPages={clustersQuery.data.totalPages}
            totalElements={clustersQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(clustersQuery.data?.totalPages ?? prev, prev + 1))}
          />
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingCluster ? "Edit cluster" : "Add cluster"}</DialogTitle>
              <DialogDescription>
                {editingCluster
                  ? "Update cluster details, then save your changes."
                  : "Add a new cluster to the community structure."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Cluster name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
              <SelectField value={woredaId} onValueChange={setWoredaId} options={woredaOptions} placeholder="Select woreda" className="h-11" />
              <SelectField value={federationId} onValueChange={setFederationId} options={federationOptions} placeholder="Assign to federation (optional)" className="h-11" />
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
                idleLabel={editingCluster ? "Save cluster" : "Add cluster"}
                pendingLabel={editingCluster ? "Saving..." : "Adding..."}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClusterDetailDialog
        id={viewingId}
        open={!!viewingId}
        onClose={() => setViewingId(null)}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete cluster</AlertDialogTitle>
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
                  sileo.success({ title: "Cluster deleted", description: result.message });
                  setPendingDelete(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete cluster",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete cluster
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
