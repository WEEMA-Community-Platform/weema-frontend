"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
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

function useAssignmentEntity() {
  const t = useTranslations("survey.assign.entities");
  return (targetType?: string) => {
    const normalized = (targetType ?? "").toUpperCase();
    if (normalized === "CLUSTER") {
      return { singular: t("clusterSingular"), plural: t("clusterPlural") };
    }
    // MEMBER and SELF_HELP_GROUP/SHG surveys are assigned to SHGs.
    return { singular: t("shgSingular"), plural: t("shgPlural") };
  };
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
  ariaLabel,
}: {
  row: SurveyAssignmentTargetRow;
  onRemove: (row: SurveyAssignmentTargetRow) => void;
  isRemoving: boolean;
  removeLabel: string;
  ariaLabel: string;
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
        aria-label={ariaLabel}
        disabled={isRemoving}
        onClick={() => onRemove(row)}
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2Icon className="size-3.5" />
      </Button>
      <span className="sr-only">{removeLabel}</span>
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
  entityLabelPlural,
}: {
  target: PendingRemove;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  entityLabel: string;
  entityLabelPlural: string;
}) {
  const tRemove = useTranslations("survey.assign.remove");
  const tActions = useTranslations("common.actions");
  // Keep last non-null value to avoid flash during exit animation.
  const [latchedTarget, setLatchedTarget] = useState<PendingRemove>(target);
  if (target && target !== latchedTarget) setLatchedTarget(target);
  const t = latchedTarget;

  return (
    <AlertDialog open={!!target} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {tRemove("title", { label: entityLabel })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tRemove.rich("confirm", {
              name: t?.name ?? "",
              labelPlural: entityLabelPlural,
              strong: (chunks) => (
                <span className="font-semibold text-foreground">{chunks}</span>
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tActions("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {tRemove("submitting")}
              </>
            ) : (
              tRemove("submit", { label: entityLabel })
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
  const tAssign = useTranslations("survey.assign");
  const tRemove = useTranslations("survey.assign.remove");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");
  const assignmentEntityFor = useAssignmentEntity();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(
    open && surveyId ? surveyId : null
  );

  // Reset transient state only when the dialog transitions to open for a
  // (new) survey. This avoids clearing during exit animations.
  const nextSessionKey = open && surveyId ? surveyId : null;
  if (nextSessionKey !== sessionKey) {
    setSessionKey(nextSessionKey);
    if (nextSessionKey) {
      setSearchInput("");
      setDebouncedSearch("");
      setSelectedFacilitatorId("");
      setSelectedIds(new Set());
    }
  }

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
  const assignmentEntity = assignmentEntityFor(targetType);
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

  // Keep selections only for rows still available after server-side filtering.
  // Computed via "adjust state during render" so it doesn't trigger an extra
  // render like setState-in-useEffect does.
  const [availableSync, setAvailableSync] = useState(available);
  if (available !== availableSync) {
    setAvailableSync(available);
    if (selectedIds.size > 0) {
      const availableIdSet = new Set(available.map((row) => row.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of selectedIds) {
        if (availableIdSet.has(id)) next.add(id);
        else changed = true;
      }
      if (changed) setSelectedIds(next);
    }
  }

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
        title: tAssign("toasts.assignedTitle", { plural: assignmentEntity.plural }),
        description: result.message ?? tAssign("toasts.assignedMessage"),
      });
      setSelectedIds(new Set());
    } catch (e) {
      sileo.error({
        title: tAssign("toasts.assignErrorTitle", {
          plural: assignmentEntity.plural,
        }),
        description: e instanceof Error ? e.message : tValidation("unexpectedError"),
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
        title: tAssign("toasts.removedTitle", { plural: assignmentEntity.plural }),
        description: result.message ?? tAssign("toasts.removedMessage"),
      });
      setPendingRemove(null);
    } catch (e) {
      sileo.error({
        title: tAssign("toasts.removeErrorTitle", {
          label: assignmentEntity.singular,
        }),
        description: e instanceof Error ? e.message : tValidation("unexpectedError"),
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>{tAssign("title")}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{surveyTitle}</span>
              <span className="block mt-1.5">
                {tAssign("assignableDescription", { plural: assignmentEntity.plural })}
              </span>
              <span className="block mt-2 text-foreground/90">
                {tAssign.rich("assignableHint", {
                  plural: assignmentEntity.plural,
                  strong: (chunks) => (
                    <span className="font-medium text-foreground">{chunks}</span>
                  ),
                })}
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
                  {error instanceof Error ? error.message : tAssign("loadError")}
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  {tActions("retry")}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="assign-target-search">{tAssign("searchLabel")}</Label>
                    <Input
                      id="assign-target-search"
                      placeholder={tAssign("searchPlaceholder", {
                        plural: assignmentEntity.plural,
                      })}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assign-target-facilitator">
                      {tAssign("facilitatorLabel")}
                    </Label>
                    <SelectField
                      id="assign-target-facilitator"
                      value={selectedFacilitatorId}
                      placeholder={
                        facilitatorsQuery.isLoading
                          ? tAssign("facilitatorLoadingPlaceholder")
                          : tAssign("facilitatorAllPlaceholder")
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
                      {tAssign("assignedHeading")}
                    </p>
                    <Badge variant="secondary">{assigned.length}</Badge>
                  </div>
                  {assigned.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                      {tAssign("emptyAssigned", { plural: assignmentEntity.plural })}
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
                          ariaLabel={tRemove("ariaLabel", {
                            label: assignmentEntity.singular,
                            name: row.name,
                          })}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {tAssign("availableHeading")}
                    </p>
                    <Badge variant="secondary">{available.length}</Badge>
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                    {available.length === 0 ? (
                      <p className="px-3 py-6 text-sm text-center text-muted-foreground">
                        {tAssign("emptyAvailable", {
                          plural: assignmentEntity.plural,
                        })}
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
                      {tAssign("selectedCount", { count: selectedIds.size })}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tActions("close")}
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
                  {tAssign("applying")}
                </>
              ) : selectedIds.size > 0 ? (
                tAssign("applyWithCount", {
                  plural: assignmentEntity.plural,
                  count: selectedIds.size,
                })
              ) : (
                tAssign("apply", { plural: assignmentEntity.plural })
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
        entityLabelPlural={assignmentEntity.plural}
      />
    </>
  );
}
