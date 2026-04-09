"use client";

import { LockIcon, UnlockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStateRow, TableShell, tableActionsCellClass, tableRowActionsClass } from "@/components/base-data/shared";
import { LockedBadge } from "@/components/community/community-card";
import { TableCell, TableRow } from "@/components/ui/table";
import type { SurveySubmissionRecord } from "@/lib/api/surveys";

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

export function SubmissionStatusBadge({ status }: { status?: string | null }) {
  const normalized = (status ?? "NOT_STARTED").toUpperCase();
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
  const label = status ? status.replaceAll("_", " ") : "Pending";
  return <Badge variant="outline">{label}</Badge>;
}

function isNotStartedStatus(status?: string | null) {
  const normalized = (status ?? "NOT_STARTED").toUpperCase();
  return normalized === "NOT_STARTED" || normalized === "NOT STARTED" || normalized === "PENDING";
}

type MemberSubmissionsTableCardProps = {
  selectedAssignmentName?: string;
  targetLabelSingular: string;
  targetLabelPlural: string;
  submissions: SurveySubmissionRecord[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onPrimaryAction: (submission: SurveySubmissionRecord) => void;
  onLockSubmission: (submission: SurveySubmissionRecord) => void;
  onUnlockSubmission: (submission: SurveySubmissionRecord) => void;
};

export function MemberSubmissionsTableCard({
  selectedAssignmentName,
  targetLabelSingular,
  targetLabelPlural,
  submissions,
  loading,
  isError,
  errorMessage,
  onRetry,
  onPrimaryAction,
  onLockSubmission,
  onUnlockSubmission,
}: MemberSubmissionsTableCardProps) {
  const titleTargetLabel = targetLabelPlural[0]
    ? targetLabelPlural[0].toUpperCase() + targetLabelPlural.slice(1)
    : targetLabelPlural;
  const rowTargetLabel = targetLabelSingular[0]
    ? targetLabelSingular[0].toUpperCase() + targetLabelSingular.slice(1)
    : targetLabelSingular;

  return (
    <Card className="gap-0 border border-primary/10 bg-card py-0 ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 pb-4 pt-4">
        <CardTitle>
          {`${titleTargetLabel} submissions${selectedAssignmentName ? ` - ${selectedAssignmentName}` : ""}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-4 pt-0">
        <TableShell
          variant="embedded"
          headers={[rowTargetLabel, "Status", "Progress", "Submitted", "Locked", "Actions"]}
          loading={loading}
          loadingColumnCount={6}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={
            <EmptyStateRow
              colSpan={6}
              message={
                selectedAssignmentName
                  ? `No ${targetLabelPlural} submissions found for this self-help group.`
                  : `No ${targetLabelPlural} submissions found for this survey.`
              }
            />
          }
        >
          {submissions.map((submission, index) => {
            const progress =
              (submission.totalQuestions ?? 0) > 0
                ? Math.round(((submission.answeredQuestions ?? 0) / (submission.totalQuestions ?? 0)) * 100)
                : 0;
            const rowKey =
              submission.id ||
              `${submission.targetId || submission.memberId || submission.targetName || submission.memberName || "target"}-${submission.surveyAssignmentId || "pending"}-${index}`;
            const hasSubmissionId = Boolean(submission.id);
            const hasTargetId = Boolean(submission.targetId || submission.memberId);
            const fillMode = isNotStartedStatus(submission.submissionStatus);
            const actionLabel = isNotStartedStatus(submission.submissionStatus)
              ? "Fill survey"
              : "View answers";
            const displayName = submission.targetName || submission.memberName;
            return (
              <TableRow key={rowKey}>
                <TableCell>
                  <p className="truncate text-sm font-medium">
                    {displayName || `Unknown ${targetLabelSingular}`}
                  </p>
                </TableCell>
                <TableCell className="text-sm">
                  <SubmissionStatusBadge status={submission.submissionStatus} />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {submission.answeredQuestions ?? 0}/{submission.totalQuestions ?? 0} answered
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
                      disabled={fillMode ? !hasTargetId : !hasSubmissionId}
                      onClick={() => onPrimaryAction(submission)}
                    >
                      {actionLabel}
                    </Button>
                    {submission.locked ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs text-amber-600 hover:border-amber-300 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                        disabled={!hasSubmissionId}
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
                        disabled={!hasSubmissionId}
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
      </CardContent>
    </Card>
  );
}
