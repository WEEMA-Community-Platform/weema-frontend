"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { sileo } from "sileo";

import {
  useAssignSurveyTargetsMutation,
  useSurveyAssignmentTargetsQuery,
  useSurveyDetailQuery,
  useUnassignSurveyTargetsMutation,
} from "@/hooks/use-surveys";
import { useUsersQuery } from "@/hooks/use-users-admin";
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
import { SelectField } from "@/components/base-data/select-field";

type PendingRemove = SurveyAssignmentTargetRow | null;

function getAssignmentEntity(targetType?: string) {
  const normalized = (targetType ?? "").toUpperCase();
  if (normalized === "CLUSTER") {
    return { singular: "cluster", plural: "clusters" };
  }
  // MEMBER and SELF_HELP_GROUP/SHG surveys are assigned to SHGs.
  return { singular: "SHG", plural: "SHGs" };
}

function resolveAssignmentRows(
  primary: SurveyAssignmentTargetRow[] | null | undefined,
  fallbackA?: SurveyAssignmentTargetRow[] | null,
  fallbackB?: SurveyAssignmentTargetRow[] | null
) {
  if (primary && primary.length > 0) return primary;
  if (fallbackA && fallbackA.length > 0) return fallbackA;
  if (fallbackB && fallbackB.length > 0) return fallbackB;
  return primary ?? fallbackA ?? fallbackB ?? [];
}

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
  entityLabel,
}: {
  target: PendingRemove;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  entityLabel: string;
}) {
  // Keep last non-null value to avoid flash during exit animation.
  const lastTarget = useRef(target);
  if (target) lastTarget.current = target;
  const t = lastTarget.current;

  return (
    <AlertDialog open={!!target} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Remove assigned ${entityLabel}`}</AlertDialogTitle>
          <AlertDialogDescription>
            Remove{" "}
            <span className="font-semibold text-foreground">{t?.name}</span>{" "}
            from this survey's assigned {entityLabel}s? It can be re-added at any time.
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
              `Remove ${entityLabel}`
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
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const surveyDetailQuery = useSurveyDetailQuery(surveyId, {
    enabled: open && !!surveyId,
  });

  const { data, isLoading, isError, error, refetch } = useSurveyAssignmentTargetsQuery(
    surveyId,
    {
      search: debouncedSearch || undefined,
      facilitatorId: selectedFacilitatorId || undefined,
    },
    { enabled: open && !!surveyId }
  );

  const facilitatorsQuery = useUsersQuery({
    page: 1,
    pageSize: 200,
    roles: ["ROLE_FACILITATOR"],
    isActive: true,
  });

  const assignMutation = useAssignSurveyTargetsMutation();
  const unassignMutation = useUnassignSurveyTargetsMutation();

  const assignmentData = data?.assignmentData;
  const assigned = useMemo(
    () =>
      resolveAssignmentRows(
        assignmentData?.assignedTargets,
        assignmentData?.assignedSelfHelpGroups,
        assignmentData?.assignedClusters
      ),
    [assignmentData]
  );
  const available = useMemo(
    () =>
      resolveAssignmentRows(
        assignmentData?.availableTargets,
        assignmentData?.availableSelfHelpGroups,
        assignmentData?.availableClusters
      ),
    [assignmentData]
  );
  const targetType = surveyDetailQuery.data?.survey?.targetType;
  const assignmentEntity = getAssignmentEntity(targetType);
  const facilitatorOptions = useMemo(
    () =>
      (facilitatorsQuery.data?.users ?? []).map((user) => {
        const name = `${user.firstName} ${user.lastName}`.trim();
        return {
          value: user.id,
          label: name ? `${name} (${user.email})` : user.email,
        };
      }),
    [facilitatorsQuery.data?.users]
  );

  /** Reset only when opening (or switching survey), not on close — avoids flashing empty state during exit animation. */
  useEffect(() => {
    if (open && surveyId) {
      setSearchInput("");
      setDebouncedSearch("");
      setSelectedFacilitatorId("");
      setSelectedIds(new Set());
    }
  }, [open, surveyId]);

  useEffect(() => {
    // Keep selections only for rows still available after server-side filtering.
    const availableIdSet = new Set(available.map((row) => row.id));
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of prev) {
        if (availableIdSet.has(id)) next.add(id);
      }
      return next;
    });
  }, [available]);

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
        title: `${assignmentEntity.plural} assigned`,
        description: result.message ?? "Assignment updated.",
      });
      setSelectedIds(new Set());
    } catch (e) {
      sileo.error({
        title: `Could not assign ${assignmentEntity.plural}`,
        description: e instanceof Error ? e.message : "Unexpected error",
      });
    }
  };

  const handleConfirmRemove = async () => {
    if (!surveyId || !pendingRemove) return;
    try {
      const result = await unassignMutation.mutateAsync({
        surveyId,
        targetIds: [pendingRemove.id],
      });
      sileo.success({
        title: `${assignmentEntity.plural} updated`,
        description: result.message ?? "Assignment removed.",
      });
      setPendingRemove(null);
    } catch (e) {
      sileo.error({
        title: `Could not remove ${assignmentEntity.singular}`,
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
                Assign from available {assignmentEntity.plural}.
              </span>
              <span className="block mt-2 text-foreground/90">
                This survey can be assigned to{" "}
                <span className="font-medium text-foreground">{assignmentEntity.plural}</span>.
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="assign-target-search">Search</Label>
                    <Input
                      id="assign-target-search"
                      placeholder={`Search ${assignmentEntity.plural}...`}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assign-target-facilitator">Facilitator</Label>
                    <SelectField
                      id="assign-target-facilitator"
                      value={selectedFacilitatorId}
                      placeholder={
                        facilitatorsQuery.isLoading
                          ? "Loading facilitators..."
                          : "All facilitators"
                      }
                      options={facilitatorOptions}
                      onValueChange={setSelectedFacilitatorId}
                      className={inputClass}
                      disabled={facilitatorsQuery.isLoading}
                    />
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
                      {`No ${assignmentEntity.plural} assigned yet.`}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                      {assigned.map((row) => (
                        <TargetRow
                          key={row.id}
                          row={row}
                          onRemove={(item) => setPendingRemove(item)}
                          isRemoving={unassignMutation.isPending && pendingRemove?.id === row.id}
                          removeLabel={assignmentEntity.singular}
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
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                    {available.length === 0 ? (
                      <p className="px-3 py-6 text-sm text-center text-muted-foreground">
                        {`No additional ${assignmentEntity.plural} available for current filters.`}
                      </p>
                    ) : (
                      available.map((row) => (
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
                      {selectedIds.size} selected
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
                `Assign ${assignmentEntity.plural}${
                  selectedIds.size > 0 ? ` (${selectedIds.size})` : ""
                }`
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
        entityLabel={assignmentEntity.singular}
      />
    </>
  );
}
