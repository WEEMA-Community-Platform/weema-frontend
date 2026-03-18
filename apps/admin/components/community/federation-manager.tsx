"use client";

import { FormEvent, useState } from "react";
import { EyeIcon } from "lucide-react";
import { sileo } from "sileo";

import {
  useCreateFederationMutation,
  useDeleteFederationMutation,
  useFederationDetailQuery,
  useFederationsQuery,
  useUpdateFederationMutation,
} from "@/hooks/use-community";
import { useCurrentUser } from "@/hooks/use-user";
import type { EntityStatus, Federation } from "@/lib/api/community";
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

function FederationDetailDialog({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useFederationDetailQuery(id);
  const fed = data?.federation;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fed?.name ?? "Federation details"}</DialogTitle>
          <DialogDescription>Full details for this federation.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : fed ? (
            <dl className="grid grid-cols-[140px_1fr] gap-x-6 gap-y-3.5">
              <DetailField label="Name" value={fed.name} />
              <DetailField label="Location" value={fed.location} />
              <DetailField label="Status" value={<StatusBadge status={fed.status} />} />
              <DetailField label="Manager" value={fed.managerName} />
              <DetailField label="Clusters" value={fed.clusterCount} />
              <DetailField label="Description" value={fed.description} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load details.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FederationManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [editingFederation, setEditingFederation] = useState<Federation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Federation | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const federationsQuery = useFederationsQuery({ page, pageSize: 10, searchQuery });
  const { data: currentUserData } = useCurrentUser();
  const createMutation = useCreateFederationMutation();
  const updateMutation = useUpdateFederationMutation();
  const deleteMutation = useDeleteFederationMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setName("");
    setDescription("");
    setLocation("");
    setStatus("ACTIVE");
    setEditingFederation(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (federation: Federation) => {
    setEditingFederation(federation);
    setName(federation.name);
    setDescription(federation.description || "");
    setLocation(federation.location || "");
    setStatus(federation.status);
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      sileo.warning({ title: "Missing name", description: "Federation name is required." });
      return;
    }

    const managerId = currentUserData?.user?.id;

    try {
      if (editingFederation) {
        const result = await updateMutation.mutateAsync({
          id: editingFederation.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            location: location.trim(),
            status,
            ...(managerId ? { managerId } : {}),
          },
        });
        sileo.success({ title: "Federation updated", description: result.message });
      } else {
        const result = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          status,
          ...(managerId ? { managerId } : {}),
        });
        sileo.success({ title: "Federation added", description: result.message });
      }

      setPage(1);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      sileo.error({
        title: "Could not save federation",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Federations</CardTitle>
        <DataToolbar
          searchPlaceholder="Search federations"
          searchValue={searchQuery}
          onSearchChange={(value) => { setSearchQuery(value); setPage(1); }}
          onAdd={openCreate}
          addLabel="Add federation"
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Location", "Status", "Clusters", "Actions"]}
          loading={federationsQuery.isLoading}
          loadingColumnCount={5}
          emptyState={
            <EmptyStateRow colSpan={5} message="No federations found. Add your first federation to get started." />
          }
        >
          {federationsQuery.data?.federations?.map((federation) => (
            <TableRow key={federation.id}>
              <TableCell className="font-medium">{federation.name}</TableCell>
              <TableCell className={descriptionCellClass}>{federation.location || "---"}</TableCell>
              <TableCell><StatusBadge status={federation.status} /></TableCell>
              <TableCell className="text-muted-foreground">{federation.clusterCount}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setViewingId(federation.id)}>
                    <EyeIcon className="size-3.5" />
                    View
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(federation)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDelete(federation)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {federationsQuery.data && (
          <PaginationRow
            currentPage={federationsQuery.data.currentPage}
            totalPages={federationsQuery.data.totalPages}
            totalElements={federationsQuery.data.totalElements}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(federationsQuery.data?.totalPages ?? prev, prev + 1))}
          />
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{editingFederation ? "Edit federation" : "Add federation"}</DialogTitle>
              <DialogDescription>
                {editingFederation
                  ? "Update federation details, then save your changes."
                  : "Add a new federation to the community structure."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-auto px-5 pb-4">
              <Input placeholder="Federation name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
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
                idleLabel={editingFederation ? "Save federation" : "Add federation"}
                pendingLabel={editingFederation ? "Saving..." : "Adding..."}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FederationDetailDialog
        id={viewingId}
        open={!!viewingId}
        onClose={() => setViewingId(null)}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete federation</AlertDialogTitle>
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
                  sileo.success({ title: "Federation deleted", description: result.message });
                  setPendingDelete(null);
                } catch (error) {
                  sileo.error({
                    title: "Could not delete federation",
                    description: error instanceof Error ? error.message : "Unexpected error",
                  });
                }
              }}
            >
              Delete federation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
