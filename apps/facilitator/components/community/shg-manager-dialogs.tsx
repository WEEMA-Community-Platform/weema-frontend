"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

import { useSHGDetailQuery } from "@/hooks/use-community";
import type { EntityStatus, SHG } from "@/lib/api/community";
import { StatusBadge } from "@/components/community/community-card";
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

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium wrap-break-word">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </dd>
    </>
  );
}

export function SHGDetailDialog({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const tDetail = useTranslations("community.shg.detail");
  const tActions = useTranslations("common.actions");
  const [activeId, setActiveId] = useState<string | null>(id);
  const [syncedId, setSyncedId] = useState<string | null>(id);

  // Latch `id` into `activeId` whenever a new SHG is selected while open.
  // Keeping the last value avoids flicker during the dialog's exit animation.
  if (open && id && id !== syncedId) {
    setSyncedId(id);
    setActiveId(id);
  }

  const { data, isLoading, isError, error, refetch } =
    useSHGDetailQuery(activeId);
  const shg = data?.selfHelpGroup;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="w-[min(100vw-1.5rem,42rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{shg?.name ?? tDetail("title")}</DialogTitle>
          <DialogDescription>{tDetail("description")}</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : tDetail("errorFallback")}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                {tActions("retry")}
              </button>
            </div>
          ) : shg ? (
            <dl className="grid grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_112px_minmax(0,1fr)] gap-x-3 gap-y-2.5 ">
              <DetailField label={tDetail("fields.name")} value={shg.name} />
              <DetailField
                label={tDetail("fields.status")}
                value={<StatusBadge status={shg.status} />}
              />
              <DetailField
                label={tDetail("fields.cluster")}
                value={shg.clusterName}
              />
              <DetailField
                label={tDetail("fields.woreda")}
                value={shg.woredaName}
              />
              <DetailField
                label={tDetail("fields.kebele")}
                value={shg.kebeleName}
              />
              <DetailField
                label={tDetail("fields.facilitator")}
                value={shg.facilitatorName}
              />
              <DetailField
                label={tDetail("fields.members")}
                value={shg.memberCount}
              />
              <DetailField
                label={tDetail("fields.gps")}
                value={
                  shg.latitude != null && shg.longitude != null
                    ? `${shg.latitude}, ${shg.longitude}`
                    : null
                }
              />
              <DetailField
                label={tDetail("fields.description")}
                value={shg.description}
              />
            </dl>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  latitude,
  longitude,
  mapsUrl,
  coordinateMode,
  woredaOptions,
  kebeleOptions,
  clusterFormOptions,
  statusOptions,
  setName,
  setDescription,
  setStatus,
  setWoredaId,
  setKebeleId,
  setClusterId,
  handleMapsUrlChange,
  handleMapsUrlBlur,
  handleMapsPaste,
  handleManualCoordinateInput,
  switchToMapLinkEntry,
  setCoordinateMode,
  setMapsUrl,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSHG: SHG | null;
  name: string;
  description: string;
  status: EntityStatus | "";
  woredaId: string;
  kebeleId: string;
  clusterId: string;
  latitude: string;
  longitude: string;
  mapsUrl: string;
  coordinateMode: "idle" | "map" | "manual";
  woredaOptions: Array<{ value: string; label: string }>;
  kebeleOptions: Array<{ value: string; label: string }>;
  clusterFormOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setStatus: (value: EntityStatus | "") => void;
  setWoredaId: (value: string) => void;
  setKebeleId: (value: string) => void;
  setClusterId: (value: string) => void;
  handleMapsUrlChange: (value: string) => void;
  handleMapsUrlBlur: () => void;
  handleMapsPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleManualCoordinateInput: (field: "lat" | "lng", value: string) => void;
  switchToMapLinkEntry: () => void;
  setCoordinateMode: (mode: "idle" | "map" | "manual") => void;
  setMapsUrl: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  const tForm = useTranslations("community.shg.form");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,50rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <form
          className="flex max-h-[85vh] flex-col overflow-hidden"
          onSubmit={onSubmit}
        >
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>
              {editingSHG ? tForm("titleEdit") : tForm("titleAdd")}
            </DialogTitle>
            <DialogDescription>
              {editingSHG
                ? tForm("descriptionEdit")
                : tForm("descriptionAdd")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tForm("sectionDetails")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="shg-name">{tForm("nameLabel")}</Label>
                <Input
                  id="shg-name"
                  placeholder={tForm("namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              {editingSHG ? (
                <div className="space-y-1.5">
                  <Label htmlFor="shg-cluster">{tForm("cluster")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {tForm("clusterHint")}
                  </p>
                  <SelectField
                    id="shg-cluster"
                    value={clusterId || "none"}
                    onValueChange={setClusterId}
                    options={clusterFormOptions}
                    placeholder={tForm("clusterPlaceholder")}
                    className="h-11"
                  />
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shg-woreda">{tForm("woreda")}</Label>
                  <SelectField
                    id="shg-woreda"
                    value={woredaId || "none"}
                    onValueChange={setWoredaId}
                    options={woredaOptions}
                    placeholder={tForm("woredaPlaceholder")}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shg-status">{tForm("status")}</Label>
                  <SelectField
                    id="shg-status"
                    value={status}
                    onValueChange={(v) => setStatus(v as EntityStatus | "")}
                    options={statusOptions}
                    placeholder={tForm("statusPlaceholder")}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shg-kebele">{tForm("kebele")}</Label>
                <SelectField
                  id="shg-kebele"
                  value={kebeleId || "none"}
                  onValueChange={setKebeleId}
                  options={kebeleOptions}
                  placeholder={tForm("kebelePlaceholder")}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tForm("sectionCoordinates")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tForm("coordinatesHint")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="shg-maps-url">{tForm("mapLink")}</Label>
                <Input
                  id="shg-maps-url"
                  type="text"
                  placeholder={tForm("mapLinkPlaceholder")}
                  value={mapsUrl}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  onBlur={handleMapsUrlBlur}
                  onPaste={handleMapsPaste}
                  disabled={coordinateMode === "manual"}
                  className={cn(
                    inputClass,
                    coordinateMode === "manual" &&
                      "cursor-not-allowed bg-muted/50 opacity-80"
                  )}
                  autoComplete="off"
                />
                {coordinateMode === "manual" ? (
                  <p className="text-xs text-muted-foreground">
                    {tForm("manualNote")}{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      onClick={switchToMapLinkEntry}
                    >
                      {tForm("useMapLinkInstead")}
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
                    {tForm("editManually")}
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shg-latitude">{tForm("latitude")}</Label>
                  <Input
                    id="shg-latitude"
                    placeholder={tForm("latitudePlaceholder")}
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) =>
                      handleManualCoordinateInput("lat", e.target.value)
                    }
                    readOnly={coordinateMode === "map"}
                    className={cn(
                      inputClass,
                      coordinateMode === "map" &&
                        "cursor-not-allowed bg-muted/50"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shg-longitude">{tForm("longitude")}</Label>
                  <Input
                    id="shg-longitude"
                    placeholder={tForm("longitudePlaceholder")}
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) =>
                      handleManualCoordinateInput("lng", e.target.value)
                    }
                    readOnly={coordinateMode === "map"}
                    className={cn(
                      inputClass,
                      coordinateMode === "map" &&
                        "cursor-not-allowed bg-muted/50"
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shg-description">
                {tForm("descriptionLabel")}
              </Label>
              <textarea
                id="shg-description"
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder={tForm("descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end border-t border-border/60 px-6 py-4">
            <SaveButton
              isPending={isSubmitting}
              idleLabel={
                editingSHG ? tForm("saveEditLabel") : tForm("saveAddLabel")
              }
              pendingLabel={
                editingSHG
                  ? tForm("saveEditPending")
                  : tForm("saveAddPending")
              }
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
  const tActions = useTranslations("common.actions");
  return (
    <AlertDialog open={!!pendingDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete self-help group</AlertDialogTitle>
          <AlertDialogDescription>
            Delete{" "}
            <span className="font-semibold text-foreground">
              {pendingDelete?.name}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tActions("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => void onConfirmDelete()}
          >
            Delete SHG
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
