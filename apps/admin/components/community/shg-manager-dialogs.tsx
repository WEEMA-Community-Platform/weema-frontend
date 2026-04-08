"use client";

import { useEffect, useRef, useState } from "react";
import { LockIcon, UnlockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { sileo } from "sileo";

import { useSHGDetailQuery } from "@/hooks/use-community";
import type { EntityStatus, SHG } from "@/lib/api/community";
import { StatusBadge } from "@/components/community/community-card";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BaseApiResponse } from "@/lib/api/base-data";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton, inputClass } from "@/components/base-data/shared";
import { SelectField } from "@/components/base-data/select-field";

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium wrap-break-word">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </dd>
    </>
  );
}

export function SHGDetailDialog({ id, open, onClose }: { id: string | null; open: boolean; onClose: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(id);

  useEffect(() => {
    if (open && id) setActiveId(id);
  }, [open, id]);

  const { data, isLoading, isError, error, refetch } = useSHGDetailQuery(activeId);
  const shg = data?.selfHelpGroup;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[min(100vw-1.5rem,42rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{shg?.name ?? "Self-Help Group details"}</DialogTitle>
          <DialogDescription>Full details for this self-help group.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Could not load details."}
              </p>
              <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-primary hover:underline">
                Retry
              </button>
            </div>
          ) : shg ? (
            <dl className="grid grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_112px_minmax(0,1fr)] gap-x-3 gap-y-2.5 ">
              <DetailField label="Name" value={shg.name} />
              <DetailField label="Status" value={<StatusBadge status={shg.status} />} />
              <DetailField label="Cluster" value={shg.clusterName} />
              <DetailField label="Woreda" value={shg.woredaName} />
              <DetailField label="Kebele" value={shg.kebeleName} />
              <DetailField label="Facilitator" value={shg.facilitatorName} />
              <DetailField label="Members" value={shg.memberCount} />
              <DetailField label="GPS" value={shg.latitude != null && shg.longitude != null ? `${shg.latitude}, ${shg.longitude}` : null} />
              <DetailField label="Description" value={shg.description} />
            </dl>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SHGFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSHG: SHG | null;
  name: string;
  description: string;
  status: EntityStatus | "";
  woredaId: string;
  kebeleId: string;
  clusterId: string;
  facilitatorId: string;
  facilitatorSearchQuery?: string;
  latitude: string;
  longitude: string;
  mapsUrl: string;
  coordinateMode: "idle" | "map" | "manual";
  woredaOptions: Array<{ value: string; label: string }>;
  kebeleOptions: Array<{ value: string; label: string }>;
  clusterFormOptions: Array<{ value: string; label: string }>;
  facilitatorOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setStatus: (value: EntityStatus | "") => void;
  setWoredaId: (value: string) => void;
  setKebeleId: (value: string) => void;
  setClusterId: (value: string) => void;
  setFacilitatorId: (value: string) => void;
  setFacilitatorSearchQuery?: (value: string) => void;
  handleMapsUrlChange: (value: string) => void;
  handleMapsUrlBlur: () => void;
  handleMapsPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleManualCoordinateInput: (field: "lat" | "lng", value: string) => void;
  switchToMapLinkEntry: () => void;
  setCoordinateMode: (mode: "idle" | "map" | "manual") => void;
  setMapsUrl: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  isFacilitatorsLoading: boolean;
};

export function SHGFormDialog({
  open,
  onOpenChange,
  editingSHG,
  name,
  description,
  status,
  woredaId,
  kebeleId,
  clusterId,
  facilitatorId,
  latitude,
  longitude,
  mapsUrl,
  coordinateMode,
  woredaOptions,
  kebeleOptions,
  clusterFormOptions,
  facilitatorOptions,
  statusOptions,
  setName,
  setDescription,
  setStatus,
  setWoredaId,
  setKebeleId,
  setClusterId,
  setFacilitatorId,
  handleMapsUrlChange,
  handleMapsUrlBlur,
  handleMapsPaste,
  handleManualCoordinateInput,
  switchToMapLinkEntry,
  setCoordinateMode,
  setMapsUrl,
  onSubmit,
  isSubmitting,
  isFacilitatorsLoading,
}: SHGFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,50rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <form className="flex max-h-[85vh] flex-col overflow-hidden" onSubmit={onSubmit}>
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>{editingSHG ? "Edit self-help group" : "Add self-help group"}</DialogTitle>
            <DialogDescription>
              {editingSHG
                ? "Update SHG details, then save your changes."
                : "Add a new self-help group to the community structure. Cluster can be linked when you edit this SHG."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
              <div className="space-y-1.5">
                <Label htmlFor="shg-name">Name</Label>
                <Input
                  id="shg-name"
                  placeholder="SHG name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              {editingSHG ? (
                <div className="space-y-1.5">
                  <Label htmlFor="shg-cluster">Cluster</Label>
                  <p className="text-xs text-muted-foreground">Optional. Link this SHG to a cluster when assigned.</p>
                  <SelectField
                    id="shg-cluster"
                    value={clusterId || "none"}
                    onValueChange={setClusterId}
                    options={clusterFormOptions}
                    placeholder="Select cluster"
                    className="h-11"
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="shg-facilitator">Facilitator</Label>
                <SelectField
                  id="shg-facilitator"
                  value={facilitatorId || "none"}
                  onValueChange={setFacilitatorId}
                  options={facilitatorOptions}
                  placeholder={
                    isFacilitatorsLoading
                      ? "Loading facilitators..."
                      : "Select facilitator"
                  }
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shg-woreda">Woreda</Label>
                  <SelectField
                    id="shg-woreda"
                    value={woredaId || "none"}
                    onValueChange={setWoredaId}
                    options={woredaOptions}
                    placeholder="Select woreda (optional)"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shg-status">Status</Label>
                  <SelectField
                    id="shg-status"
                    value={status}
                    onValueChange={(v) => setStatus(v as EntityStatus | "")}
                    options={statusOptions}
                    placeholder="Select status"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shg-kebele">Kebele</Label>
                <SelectField
                  id="shg-kebele"
                  value={kebeleId || "none"}
                  onValueChange={setKebeleId}
                  options={kebeleOptions}
                  placeholder="Select kebele (optional)"
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Coordinates</p>
              <p className="text-xs text-muted-foreground">
                Use a map link (coordinates locked to the link) or enter latitude and longitude yourself - switch modes
                with the actions below.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="shg-maps-url">Map link</Label>
                <Input
                  id="shg-maps-url"
                  type="text"
                  placeholder="Paste a Google Maps or Apple Maps share link..."
                  value={mapsUrl}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  onBlur={handleMapsUrlBlur}
                  onPaste={handleMapsPaste}
                  disabled={coordinateMode === "manual"}
                  className={cn(
                    inputClass,
                    coordinateMode === "manual" && "cursor-not-allowed bg-muted/50 opacity-80",
                  )}
                  autoComplete="off"
                />
                {coordinateMode === "manual" ? (
                  <p className="text-xs text-muted-foreground">
                    Map link is disabled while entering coordinates manually.{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      onClick={switchToMapLinkEntry}
                    >
                      Use map link instead
                    </button>
                  </p>
                ) : null}
                {coordinateMode === "map" ? (
                  <button
                    type="button"
                    className="text-left text-xs font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setCoordinateMode("manual");
                      setMapsUrl("");
                    }}
                  >
                    Edit coordinates manually
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shg-latitude">Latitude</Label>
                  <Input
                    id="shg-latitude"
                    placeholder="e.g. 9.03"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => handleManualCoordinateInput("lat", e.target.value)}
                    readOnly={coordinateMode === "map"}
                    className={cn(
                      inputClass,
                      coordinateMode === "map" && "cursor-not-allowed bg-muted/50",
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shg-longitude">Longitude</Label>
                  <Input
                    id="shg-longitude"
                    placeholder="e.g. 38.75"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => handleManualCoordinateInput("lng", e.target.value)}
                    readOnly={coordinateMode === "map"}
                    className={cn(
                      inputClass,
                      coordinateMode === "map" && "cursor-not-allowed bg-muted/50",
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shg-description">Description</Label>
              <textarea
                id="shg-description"
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Optional notes about this self-help group"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end border-t border-border/60 px-6 py-4">
            <SaveButton
              isPending={isSubmitting}
              idleLabel={editingSHG ? "Save SHG" : "Add SHG"}
              pendingLabel={editingSHG ? "Saving..." : "Adding..."}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SHGDeleteDialog({
  pendingDelete,
  onOpenChange,
  onConfirmDelete,
}: {
  pendingDelete: SHG | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}) {
  return (
    <AlertDialog open={!!pendingDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete self-help group</AlertDialogTitle>
          <AlertDialogDescription>
            Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void onConfirmDelete()}>
            Delete SHG
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SHGLockDialog({
  shg,
  action,
  onOpenChange,
  lockMutation,
  unlockMutation,
}: {
  shg: SHG | null;
  action: "lock" | "unlock";
  onOpenChange: (open: boolean) => void;
  lockMutation: UseMutationResult<BaseApiResponse, Error, string, unknown>;
  unlockMutation: UseMutationResult<BaseApiResponse, Error, string, unknown>;
}) {
  // Keep last non-null values so content doesn't flash during the exit animation.
  const lastShg = useRef(shg);
  const lastAction = useRef(action);
  if (shg) { lastShg.current = shg; lastAction.current = action; }
  const s = lastShg.current;
  const isLocking = lastAction.current === "lock";

  const handleConfirm = async () => {
    if (!s) return;
    try {
      if (isLocking) {
        const result = await lockMutation.mutateAsync(s.id);
        sileo.success({ title: "SHG locked", description: result.message });
      } else {
        const result = await unlockMutation.mutateAsync(s.id);
        sileo.success({ title: "SHG unlocked", description: result.message });
      }
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: isLocking ? "Could not lock SHG" : "Could not unlock SHG",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const isPending = lockMutation.isPending || unlockMutation.isPending;

  return (
    <AlertDialog open={!!shg} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isLocking ? (
              <LockIcon className="size-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <UnlockIcon className="size-4 text-amber-500" />
            )}
            {isLocking ? "Lock self-help group" : "Unlock self-help group"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLocking ? (
              <>
                Lock{" "}
                <span className="font-semibold text-foreground">{s?.name}</span>? Facilitators will not be able to edit or delete this group until it is unlocked.
              </>
            ) : (
              <>
                Unlock{" "}
                <span className="font-semibold text-foreground">{s?.name}</span>? Facilitators will be able to edit or delete this group again.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleConfirm()}
            disabled={isPending}
            className={
              isLocking
                ? "bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                : "bg-amber-600 hover:bg-amber-500"
            }
          >
            {isPending ? (
              isLocking ? "Locking..." : "Unlocking..."
            ) : (
              <>
                {isLocking ? <LockIcon className="size-4" /> : <UnlockIcon className="size-4" />}
                {isLocking ? "Lock SHG" : "Unlock SHG"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
