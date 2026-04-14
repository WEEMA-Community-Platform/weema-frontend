"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { sileo } from "sileo";

import {
  useAssignSurveyTargetsMutation,
  useSurveyAssignmentTargetsQuery,
  useUnassignSurveyTargetsMutation,
} from "@/hooks/use-surveys";
import type { SurveyAssignmentTargetRow } from "@/lib/api/surveys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { inputClass } from "@/components/base-data/shared";

type AssignmentBucket = "targets" | "clusters" | "selfHelpGroups";
type PendingRemove = { row: SurveyAssignmentTargetRow; bucket: AssignmentBucket } | null;

const BUCKET_META: Record<
  AssignmentBucket,
  { tabLabel: string; singular: string; plural: string; searchLabel: string }
> = {
  targets: { tabLabel: "Targets", singular: "target", plural: "targets", searchLabel: "targets" },
  clusters: { tabLabel: "Clusters", singular: "cluster", plural: "clusters", searchLabel: "clusters" },
  selfHelpGroups: { tabLabel: "SHGs", singular: "SHG", plural: "SHGs", searchLabel: "SHGs" },
};

function TargetRow({
  row,
  onRemove,
  isRemoving,
  removeLabel,
}: {
  row: SurveyAssignmentTargetRow;
  onRemove: (row: SurveyAssignmentTargetRow) => void;
  isRemoving: boolean;
  removeLabel: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{row.name}</p>
        {row.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground/80 mt-0.5">{row.type}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${removeLabel} ${row.name}`}
        disabled={isRemoving}
        onClick={() => onRemove(row)}
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}

/** Confirmation dialog for removing a single assigned target. */
function RemoveTargetDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: PendingRemove;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  // Keep last non-null value to avoid flash during exit animation.
  const lastTarget = useRef(target);
  if (target) lastTarget.current = target;
  const t = lastTarget.current;
  const meta = t ? BUCKET_META[t.bucket] : BUCKET_META.targets;

  return (
    <AlertDialog open={!!target} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Remove assigned ${meta.singular}`}</AlertDialogTitle>
          <AlertDialogDescription>
            Remove{" "}
            <span className="font-semibold text-foreground">{t?.row.name}</span>{" "}
            from this survey's assigned {meta.plural.toLowerCase()}? They can be re-added at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Removing…
              </>
            ) : (
              `Remove ${meta.singular.toLowerCase()}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SurveyAssignTargetsDialog({
  open,
  onOpenChange,
  surveyId,
  surveyTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string | null;
  surveyTitle: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeBucket, setActiveBucket] = useState<AssignmentBucket>("targets");
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null);

  const { data, isLoading, isError, error, refetch } = useSurveyAssignmentTargetsQuery(
    surveyId,
    { enabled: open && !!surveyId }
  );

  const assignMutation = useAssignSurveyTargetsMutation();
  const unassignMutation = useUnassignSurveyTargetsMutation();

  const assignmentData = data?.assignmentData;
  const bucketData = useMemo(
    () => ({
      targets: {
        assigned: assignmentData?.assignedTargets ?? [],
        available: assignmentData?.availableTargets ?? [],
      },
      clusters: {
        assigned: assignmentData?.assignedClusters ?? [],
        available: assignmentData?.availableClusters ?? [],
      },
      selfHelpGroups: {
        assigned: assignmentData?.assignedSelfHelpGroups ?? [],
        available: assignmentData?.availableSelfHelpGroups ?? [],
      },
    }),
    [assignmentData]
  );
  const activeMeta = BUCKET_META[activeBucket];
  const assigned = bucketData[activeBucket].assigned;
  const available = bucketData[activeBucket].available;

  const filteredAvailable = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
    );
  }, [available, search]);

  /** Reset only when opening (or switching survey), not on close — avoids flashing empty state during exit animation. */
  useEffect(() => {
    if (open && surveyId) {
      setSearch("");
      setSelectedIds(new Set());
      setActiveBucket("targets");
    }
  }, [open, surveyId]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSearch("");
  }, [activeBucket]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (!surveyId || selectedIds.size === 0) return;
    try {
      const result = await assignMutation.mutateAsync({
        surveyId,
        targetIds: [...selectedIds],
      });
      sileo.success({
        title: `${activeMeta.tabLabel} assigned`,
        description: result.message ?? "Assignment updated.",
      });
      setSelectedIds(new Set());
    } catch (e) {
      sileo.error({
        title: `Could not assign ${activeMeta.plural.toLowerCase()}`,
        description: e instanceof Error ? e.message : "Unexpected error",
      });
    }
  };

  const handleConfirmRemove = async () => {
    if (!surveyId || !pendingRemove) return;
    try {
      const result = await unassignMutation.mutateAsync({
        surveyId,
        targetIds: [pendingRemove.row.id],
      });
      sileo.success({
        title: `${BUCKET_META[pendingRemove.bucket].tabLabel} updated`,
        description: result.message ?? "Assignment removed.",
      });
      setPendingRemove(null);
    } catch (e) {
      sileo.error({
        title: `Could not remove ${BUCKET_META[pendingRemove.bucket].singular.toLowerCase()}`,
        description: e instanceof Error ? e.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Assign survey entities</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{surveyTitle}</span>
              <span className="block mt-1.5">
                Assign from available targets, clusters, or SHGs.
              </span>
              <span className="block mt-2 text-foreground/90">
                You are assigning to:{" "}
                <span className="font-medium text-foreground">{activeMeta.tabLabel}</span>.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4 space-y-5 overflow-y-auto flex-1 min-h-0">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm">
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Could not load assignment targets."}
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border/70 bg-muted/25 p-1">
                  <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(BUCKET_META) as AssignmentBucket[]).map((bucket) => {
                    const meta = BUCKET_META[bucket];
                    const count = bucketData[bucket].available.length + bucketData[bucket].assigned.length;
                    const active = bucket === activeBucket;
                    return (
                      <Button
                        key={bucket}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "ghost"}
                        onClick={() => setActiveBucket(bucket)}
                        aria-pressed={active}
                        className={`h-9 justify-between rounded-md px-2.5 transition-colors ${
                          active
                            ? ""
                            : "border border-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                        }`}
                      >
                        <span>{meta.tabLabel}</span>
                        <span className="text-xs opacity-80">{count}</span>
                      </Button>
                    );
                  })}
                </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Assigned
                    </p>
                    <Badge variant="secondary">{assigned.length}</Badge>
                  </div>
                  {assigned.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                      {`No ${activeMeta.searchLabel} assigned yet.`}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                      {assigned.map((row) => (
                        <TargetRow
                          key={row.id}
                          row={row}
                          onRemove={(item) => setPendingRemove({ row: item, bucket: activeBucket })}
                          isRemoving={unassignMutation.isPending && pendingRemove?.row.id === row.id}
                          removeLabel={activeMeta.singular}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Add from available
                    </p>
                    <Badge variant="secondary">{available.length}</Badge>
                  </div>
                  <Label htmlFor="assign-target-search" className="sr-only">
                    Search available
                  </Label>
                  <Input
                    id="assign-target-search"
                    placeholder={`Search available ${activeMeta.searchLabel}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={inputClass}
                  />
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                    {filteredAvailable.length === 0 ? (
                      <p className="px-3 py-6 text-sm text-center text-muted-foreground">
                        {search.trim()
                          ? "No matches."
                          : `No additional ${activeMeta.searchLabel} available.`}
                      </p>
                    ) : (
                      filteredAvailable.map((row) => (
                        <label
                          key={row.id}
                          className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggle(row.id)}
                            className="size-4 rounded accent-primary shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{row.name}</p>
                            {row.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-1">{row.description}</p>
                            ) : null}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedIds.size > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedIds.size} selected from {activeMeta.tabLabel}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={
                !surveyId ||
                selectedIds.size === 0 ||
                assignMutation.isPending ||
                isLoading
              }
              onClick={() => void handleAssign()}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Assigning…
                </>
              ) : (
                `Assign ${activeMeta.tabLabel}${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RemoveTargetDialog
        target={pendingRemove}
        onOpenChange={(open) => { if (!open) setPendingRemove(null); }}
        onConfirm={() => void handleConfirmRemove()}
        isPending={unassignMutation.isPending}
      />
    </>
  );
}
