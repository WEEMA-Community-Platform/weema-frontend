"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { sileo } from "sileo";

import {
  useAssignSurveyTargetsMutation,
  useSurveyAssignmentTargetsQuery,
} from "@/hooks/use-surveys";
import type { SurveyAssignmentTargetRow } from "@/lib/api/surveys";
import { Button } from "@/components/ui/button";
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

/** Survey `targetType` decides which entities the API returns (see GET …/assignment-targets). */
function entityLabelForTargetType(targetType: string): string {
  const t = (targetType ?? "").toUpperCase();
  if (t === "MEMBER") return "Self-Help Groups";
  if (t === "SELF_HELP_GROUP") return "Clusters";
  if (t === "CLUSTER") return "Federations";
  if (t === "FEDERATION") return "Federations";
  return "targets";
}

function TargetRow({ row }: { row: SurveyAssignmentTargetRow }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{row.name}</p>
        {row.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground/80 mt-0.5">{row.type}</p>
      </div>
      {/*
        TODO: add remove when DELETE (or equivalent) is exposed + useRemoveSurveyAssignmentMutation
        <Button type="button" variant="ghost" size="icon" aria-label="Remove assignment">
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      */}
    </div>
  );
}

export function SurveyAssignTargetsDialog({
  open,
  onOpenChange,
  surveyId,
  surveyTitle,
  targetType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string | null;
  surveyTitle: string;
  targetType: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error, refetch } = useSurveyAssignmentTargetsQuery(
    surveyId,
    { enabled: open && !!surveyId }
  );

  const assignMutation = useAssignSurveyTargetsMutation();

  const assignmentData = data?.assignmentData;
  const assigned = assignmentData?.assignedTargets ?? [];
  const available = assignmentData?.availableTargets ?? [];

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
    }
  }, [open, surveyId]);

  const entityLabel = entityLabelForTargetType(targetType);

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
        title: "Targets assigned",
        description: result.message ?? "Assignment updated.",
      });
      setSelectedIds(new Set());
    } catch (e) {
      sileo.error({
        title: "Could not assign targets",
        description: e instanceof Error ? e.message : "Unexpected error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Assign survey targets</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{surveyTitle}</span>
            <span className="block mt-1.5">
              Eligible targets are determined by this survey’s target type 
            </span>
            <span className="block mt-2 text-foreground/90">
              You are assigning to:{" "}
              <span className="font-medium text-foreground">{entityLabel}</span>.
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Assigned ({assigned.length})
                </p>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No targets assigned yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
                    {assigned.map((row) => (
                      <TargetRow key={row.id} row={row} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Add from available ({available.length})
                </p>
                <Label htmlFor="assign-target-search" className="sr-only">
                  Search available
                </Label>
                <Input
                  id="assign-target-search"
                  placeholder={`Search ${entityLabel.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputClass}
                />
                <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                  {filteredAvailable.length === 0 ? (
                    <p className="px-3 py-6 text-sm text-center text-muted-foreground">
                      {search.trim() ? "No matches." : "No additional targets available."}
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
              `Assign selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
