"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmptyStateRow,
  TableShell,
  tableActionsCellClass,
  tableRowActionsClass,
} from "@/components/base-data/shared";
import { TableCell, TableRow } from "@/components/ui/table";
import type {
  SurveyAssignmentTargetRow,
  SurveySubmissionRecord,
} from "@/lib/api/surveys";

const TARGETS_PAGE_SIZE = 5;

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
  const t = useTranslations("survey.submissions.status");
  const normalized = (status ?? "NOT_STARTED").toUpperCase();
  if (normalized === "SUBMITTED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        {t("submitted")}
      </Badge>
    );
  }
  if (normalized === "NOT_STARTED" || normalized === "NOT STARTED") {
    return (
      <Badge className="border-transparent bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
        {t("notStarted")}
      </Badge>
    );
  }
  if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        {t("inProgress")}
      </Badge>
    );
  }
  const label = status ? status.replaceAll("_", " ") : t("pending");
  return <Badge variant="outline">{label}</Badge>;
}

function isNotStartedStatus(status?: string | null) {
  const normalized = (status ?? "NOT_STARTED").toUpperCase();
  return (
    normalized === "NOT_STARTED" ||
    normalized === "NOT STARTED" ||
    normalized === "PENDING"
  );
}

export function AssignmentApprovalBadge({
  status,
}: {
  status?: string | null;
}) {
  const t = useTranslations("survey.submissions.approval");
  const normalized = (status || "PENDING").toUpperCase();
  if (normalized === "APPROVED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        {t("approved")}
      </Badge>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <Badge className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
        {t("rejected")}
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      {t("pending")}
    </Badge>
  );
}

type AssignedTargetsTableCardProps = {
  surveyTitle: string;
  targets: SurveyAssignmentTargetRow[];
  selectedAssignmentId?: string | null;
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onChooseAssignment: (target: SurveyAssignmentTargetRow) => void;
};

export function AssignedTargetsTableCard({
  surveyTitle,
  targets,
  selectedAssignmentId,
  loading,
  isError,
  errorMessage,
  onRetry,
  onChooseAssignment,
}: AssignedTargetsTableCardProps) {
  const t = useTranslations("survey.submissions.assignedTargets");
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(targets.length / TARGETS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedTargets = targets.slice(
    (safePage - 1) * TARGETS_PAGE_SIZE,
    safePage * TARGETS_PAGE_SIZE
  );
  const showPagination = targets.length > TARGETS_PAGE_SIZE;

  return (
    <Card className="gap-0 border border-primary/10 bg-card py-0 ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 pb-4 pt-4">
        <CardTitle>{t("title", { surveyTitle })}</CardTitle>
        {showPagination && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/10 bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              aria-label={tCommon("pagination.previous")}
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
            <span className="min-w-16 text-center">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/10 bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              aria-label={tCommon("pagination.next")}
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <TableShell
          variant="embedded"
          headers={[
            t("columnShg"),
            t("columnApproval"),
            t("columnActions"),
          ]}
          loading={loading}
          loadingColumnCount={3}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={<EmptyStateRow colSpan={3} message={t("empty")} />}
        >
          {pagedTargets.map((target) => {
            const isSelected =
              !!selectedAssignmentId &&
              target.assignmentId === selectedAssignmentId;
            return (
              <TableRow
                key={target.id}
                className={cn(
                  "transition-colors",
                  isSelected && "bg-primary/5 hover:bg-primary/8"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                    <p
                      className={cn(
                        "truncate text-sm",
                        isSelected ? "font-semibold text-primary" : "font-medium"
                      )}
                    >
                      {target.name || t("unnamed")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <AssignmentApprovalBadge status={target.approvalStatus} />
                </TableCell>
                <TableCell className={tableActionsCellClass}>
                  <div className={tableRowActionsClass}>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onChooseAssignment(target)}
                      disabled={!target.assignmentId}
                    >
                      {isSelected ? t("viewingMembers") : t("viewMembers")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableShell>
        {showPagination && (
          <p className="px-4 py-2.5 text-xs text-muted-foreground">
            {t("pagination", {
              from: (safePage - 1) * TARGETS_PAGE_SIZE + 1,
              to: Math.min(safePage * TARGETS_PAGE_SIZE, targets.length),
              total: targets.length,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
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
}: MemberSubmissionsTableCardProps) {
  const t = useTranslations("survey.submissions.memberTable");
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
          {selectedAssignmentName
            ? t("titleWithAssignment", {
                target: titleTargetLabel,
                assignment: selectedAssignmentName,
              })
            : t("title", { target: titleTargetLabel })}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <TableShell
          variant="embedded"
          headers={[
            rowTargetLabel,
            t("columnStatus"),
            t("columnProgress"),
            t("columnSubmitted"),
            t("columnActions"),
          ]}
          loading={loading}
          loadingColumnCount={5}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={
            <EmptyStateRow
              colSpan={5}
              message={
                selectedAssignmentName
                  ? t("emptyWithAssignment", { targets: targetLabelPlural })
                  : t("empty", { targets: targetLabelPlural })
              }
            />
          }
        >
          {submissions.map((submission, index) => {
            const progress =
              (submission.totalQuestions ?? 0) > 0
                ? Math.round(
                    ((submission.answeredQuestions ?? 0) /
                      (submission.totalQuestions ?? 0)) *
                      100
                  )
                : 0;
            const rowKey =
              submission.id ||
              `${submission.targetId || submission.memberId || submission.targetName || submission.memberName || "target"}-${submission.surveyAssignmentId || "pending"}-${index}`;
            const hasSubmissionId = Boolean(submission.id);
            const hasTargetId = Boolean(
              submission.targetId || submission.memberId
            );
            const fillMode = isNotStartedStatus(submission.submissionStatus);
            const actionLabel = fillMode ? t("fill") : t("viewAnswers");
            const displayName = submission.targetName || submission.memberName;

            return (
              <TableRow key={rowKey}>
                <TableCell>
                  <p className="truncate text-sm font-medium">
                    {displayName ||
                      t("unknown", { target: targetLabelSingular })}
                  </p>
                </TableCell>
                <TableCell className="text-sm">
                  <SubmissionStatusBadge status={submission.submissionStatus} />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t("answeredCount", {
                        answered: submission.answeredQuestions ?? 0,
                        total: submission.totalQuestions ?? 0,
                      })}
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, Math.max(0, progress))}%`,
                        }}
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
                      disabled={fillMode ? !hasTargetId : !hasSubmissionId}
                      onClick={() => onPrimaryAction(submission)}
                    >
                      {actionLabel}
                    </Button>
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
