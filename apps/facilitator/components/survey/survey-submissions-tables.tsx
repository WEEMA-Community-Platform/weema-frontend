"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStateRow, TableShell, tableActionsCellClass, tableRowActionsClass } from "@/components/base-data/shared";
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

export function AssignmentApprovalBadge({ status }: { status?: string | null }) {
  const normalized = (status || "PENDING").toUpperCase();
  if (normalized === "APPROVED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        Approved
      </Badge>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <Badge className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      Pending
    </Badge>
  );
}

type AssignedTargetsTableCardProps = {
  surveyTitle: string;
  targets: SurveyAssignmentTargetRow[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onChooseAssignment: (target: SurveyAssignmentTargetRow) => void;
};

export function AssignedTargetsTableCard({
  surveyTitle,
  targets,
  loading,
  isError,
  errorMessage,
  onRetry,
  onChooseAssignment,
}: AssignedTargetsTableCardProps) {
  return (
    <Card className="gap-0 border border-primary/10 bg-card py-0 ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 pb-4 pt-4">
        <CardTitle>Assigned self-help groups for {surveyTitle}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-4 pt-0">
        <TableShell
          variant="embedded"
          headers={["Self-help group", "Approval", "Actions"]}
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
                <AssignmentApprovalBadge status={target.approvalStatus} />
              </TableCell>
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onChooseAssignment(target)}
                    disabled={!target.assignmentId}
                  >
                    View members
                  </Button>
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
            headers={["Member", "Status", "Progress", "Submitted", "Actions"]}
            loading={loading}
            loadingColumnCount={5}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={onRetry}
            emptyState={
              <EmptyStateRow colSpan={5} message="No member submissions found for this self-help group." />
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
                  <TableCell className={tableActionsCellClass}>
                    <div className={tableRowActionsClass}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => onViewAnswers(submission)}
                      >
                        {submission.submissionStatus?.toUpperCase() === "SUBMITTED"
                          ? "Edit survey"
                          : "Fill survey"}
                      </Button>
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
