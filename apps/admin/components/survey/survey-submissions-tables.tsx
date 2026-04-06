"use client";

import { LockIcon, UnlockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStateRow, TableShell, tableActionsCellClass, tableRowActionsClass } from "@/components/base-data/shared";
import { LockedBadge } from "@/components/community/community-card";
import { TableCell, TableRow } from "@/components/ui/table";
import type { SurveyAssignmentTargetRow, SurveySubmissionRecord } from "@/lib/api/surveys";

export function formatSubmissionDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SubmissionStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  if (normalized === "SUBMITTED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        Submitted
      </Badge>
    );
  }
  if (normalized === "NOT_STARTED" || normalized === "NOT STARTED") {
    return (
      <Badge className="border-transparent bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
        Not started
      </Badge>
    );
  }
  if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        In progress
      </Badge>
    );
  }
  return <Badge variant="outline">{status.replaceAll("_", " ")}</Badge>;
}

type AssignedTargetsTableCardProps = {
  surveyTitle: string;
  targets: SurveyAssignmentTargetRow[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onChooseAssignment: (target: SurveyAssignmentTargetRow) => void;
  onLockAssignment: (target: SurveyAssignmentTargetRow) => void;
  onUnlockAssignment: (target: SurveyAssignmentTargetRow) => void;
};

export function AssignedTargetsTableCard({
  surveyTitle,
  targets,
  loading,
  isError,
  errorMessage,
  onRetry,
  onChooseAssignment,
  onLockAssignment,
  onUnlockAssignment,
}: AssignedTargetsTableCardProps) {
  return (
    <Card className="gap-0 border border-primary/10 bg-card py-0 ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 pb-4 pt-4">
        <CardTitle>Assigned self-help groups for {surveyTitle}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-4 pt-0">
        <TableShell
          variant="embedded"
          headers={["Self-help group", "Locked", "Actions"]}
          loading={loading}
          loadingColumnCount={3}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={<EmptyStateRow colSpan={3} message="No assigned self-help groups yet." />}
        >
          {targets.map((target) => (
            <TableRow key={target.id}>
              <TableCell>
                <p className="truncate text-sm font-medium">{target.name || "Unnamed target"}</p>
              </TableCell>
              <TableCell>
                <LockedBadge locked={target.locked ?? false} />
              </TableCell>
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    disabled={!target.assignmentId}
                    onClick={() => onChooseAssignment(target)}
                  >
                    View members
                  </Button>
                  {target.locked ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs text-amber-600 hover:border-amber-300 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                      disabled={!target.assignmentId}
                      onClick={() => onUnlockAssignment(target)}
                    >
                      <UnlockIcon className="size-3" />
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      disabled={!target.assignmentId}
                      onClick={() => onLockAssignment(target)}
                    >
                      <LockIcon className="size-3" />
                      Lock
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      </CardContent>
    </Card>
  );
}

type MemberSubmissionsTableCardProps = {
  selectedAssignmentId: string | null;
  selectedAssignmentName: string;
  submissions: SurveySubmissionRecord[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onViewAnswers: (submission: SurveySubmissionRecord) => void;
  onLockSubmission: (submission: SurveySubmissionRecord) => void;
  onUnlockSubmission: (submission: SurveySubmissionRecord) => void;
};

export function MemberSubmissionsTableCard({
  selectedAssignmentId,
  selectedAssignmentName,
  submissions,
  loading,
  isError,
  errorMessage,
  onRetry,
  onViewAnswers,
  onLockSubmission,
  onUnlockSubmission,
}: MemberSubmissionsTableCardProps) {
  return (
    <Card className="gap-0 border border-primary/10 bg-card py-0 ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 pb-4 pt-4">
        <CardTitle>
          {selectedAssignmentId
            ? `Member submissions${selectedAssignmentName ? ` - ${selectedAssignmentName}` : ""}`
            : "Member submissions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-4 pt-0">
        {!selectedAssignmentId ? (
          <div className="rounded-b-xl bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
            Select a self-help group above to load member submissions.
          </div>
        ) : (
          <TableShell
            variant="embedded"
            headers={["Member", "Status", "Progress", "Submitted", "Locked", "Actions"]}
            loading={loading}
            loadingColumnCount={6}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={onRetry}
            emptyState={
              <EmptyStateRow colSpan={6} message="No member submissions found for this self-help group." />
            }
          >
            {submissions.map((submission) => {
              const progress =
                submission.totalQuestions > 0
                  ? Math.round((submission.answeredQuestions / submission.totalQuestions) * 100)
                  : 0;
              return (
                <TableRow key={submission.id}>
                  <TableCell>
                    <p className="truncate text-sm font-medium">
                      {submission.memberName || "Unknown member"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    <SubmissionStatusBadge status={submission.submissionStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {submission.answeredQuestions}/{submission.totalQuestions} answered
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatSubmissionDateTime(submission.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <LockedBadge locked={submission.locked ?? false} />
                  </TableCell>
                  <TableCell className={tableActionsCellClass}>
                    <div className={tableRowActionsClass}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => onViewAnswers(submission)}
                      >
                        View answers
                      </Button>
                      {submission.locked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs text-amber-600 hover:border-amber-300 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                          onClick={() => onUnlockSubmission(submission)}
                        >
                          <UnlockIcon className="size-3" />
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          onClick={() => onLockSubmission(submission)}
                        >
                          <LockIcon className="size-3" />
                          Lock
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableShell>
        )}
      </CardContent>
    </Card>
  );
}
