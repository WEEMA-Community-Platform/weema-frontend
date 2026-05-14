"use client";

import { DownloadIcon, Loader2Icon, LockIcon, SlidersHorizontal, UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmptyStateRow,
  TableShell,
  tableActionsCellClass,
  tableRowActionsClass,
} from "@/components/base-data/shared";
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
  return normalized === "NOT_STARTED" || normalized === "NOT STARTED" || normalized === "PENDING";
}

type MemberSubmissionsTableCardProps = {
  selectedAssignmentName?: string;
  targetLabelSingular: string;
  targetLabelPlural: string;
  titleOverride?: string;
  emptyMessageOverride?: string;
  submissions: SurveySubmissionRecord[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onPrimaryAction: (submission: SurveySubmissionRecord) => void;
  onLockSubmission: (submission: SurveySubmissionRecord) => void;
  onUnlockSubmission: (submission: SurveySubmissionRecord) => void;
  showLockActions?: boolean;
  showSubmissionFilters?: boolean;
  hasActiveSubmissionFilters?: boolean;
  onOpenSubmissionFilters?: () => void;
  exportSubmissionsLabel?: string;
  exportSubmissionsPendingLabel?: string;
  exportSubmissionsPending?: boolean;
  onExportSubmissions?: () => void;
};

export function MemberSubmissionsTableCard({
  selectedAssignmentName,
  targetLabelSingular,
  targetLabelPlural,
  titleOverride,
  emptyMessageOverride,
  submissions,
  loading,
  isError,
  errorMessage,
  onRetry,
  onPrimaryAction,
  onLockSubmission,
  onUnlockSubmission,
  showLockActions = true,
  showSubmissionFilters = false,
  hasActiveSubmissionFilters = false,
  onOpenSubmissionFilters,
  exportSubmissionsLabel,
  exportSubmissionsPendingLabel,
  exportSubmissionsPending = false,
  onExportSubmissions,
}: MemberSubmissionsTableCardProps) {
  const t = useTranslations("survey.submissions.memberTable");
  const tTable = useTranslations("community.members.table");
  const titleTargetLabel = targetLabelPlural[0]
    ? targetLabelPlural[0].toUpperCase() + targetLabelPlural.slice(1)
    : targetLabelPlural;
  const rowTargetLabel = targetLabelSingular[0]
    ? targetLabelSingular[0].toUpperCase() + targetLabelSingular.slice(1)
    : targetLabelSingular;

  const columnCount = showLockActions ? 6 : 5;

  return (
    <Card className="gap-0 border border-primary/10 bg-card py-0 ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-primary/10 px-4 pb-4 pt-4">
        <CardTitle className="min-w-0 flex-1 text-base font-semibold leading-snug sm:text-lg">
          {titleOverride ||
            (selectedAssignmentName
            ? t("titleWithAssignment", {
                target: titleTargetLabel,
                assignment: selectedAssignmentName,
              })
            : t("title", { target: titleTargetLabel }))}
        </CardTitle>
        {showSubmissionFilters || onExportSubmissions ? (
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 shrink-0">
            {showSubmissionFilters && onOpenSubmissionFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 border-primary/30"
                onClick={onOpenSubmissionFilters}
              >
                <SlidersHorizontal className="size-4" />
                {tTable("filters")}
                {hasActiveSubmissionFilters ? (
                  <span
                    className="ml-0.5 size-1.5 rounded-full bg-primary"
                    aria-label={tTable("filtersActiveLabel")}
                  />
                ) : null}
              </Button>
            ) : null}
            {onExportSubmissions &&
            exportSubmissionsLabel &&
            exportSubmissionsPendingLabel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 border-primary/30"
                disabled={exportSubmissionsPending}
                onClick={onExportSubmissions}
              >
                {exportSubmissionsPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    {exportSubmissionsPendingLabel}
                  </>
                ) : (
                  <>
                    <DownloadIcon className="size-4" aria-hidden />
                    {exportSubmissionsLabel}
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-0 pb-4 pt-0">
        <TableShell
          variant="embedded"
          headers={[
            rowTargetLabel,
            t("columnStatus"),
            t("columnProgress"),
            t("columnSubmitted"),
            ...(showLockActions ? [t("columnLocked")] : []),
            t("columnActions"),
          ]}
          loading={loading}
          loadingColumnCount={columnCount}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={
            <EmptyStateRow
              colSpan={columnCount}
              message={
                emptyMessageOverride ||
                (selectedAssignmentName
                  ? t("emptyWithAssignment", { targets: targetLabelPlural })
                  : t("empty", { targets: targetLabelPlural }))
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
            const actionLabel = fillMode ? t("fill") : t("viewAnswers");
            const displayName = submission.targetName || submission.memberName;
            return (
              <TableRow key={rowKey}>
                <TableCell>
                  <p className="truncate text-sm font-medium">
                    {displayName || t("unknown", { target: targetLabelSingular })}
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
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatSubmissionDateTime(submission.submittedAt)}
                </TableCell>
                {showLockActions ? (
                  <TableCell>
                    <LockedBadge locked={submission.locked ?? false} />
                  </TableCell>
                ) : null}
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
                    {showLockActions && submission.locked ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs text-amber-600 hover:border-amber-300 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                        disabled={!hasSubmissionId}
                        onClick={() => onUnlockSubmission(submission)}
                      >
                        <UnlockIcon className="size-3" />
                        {t("unlock")}
                      </Button>
                    ) : showLockActions ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        disabled={!hasSubmissionId}
                        onClick={() => onLockSubmission(submission)}
                      >
                        <LockIcon className="size-3" />
                        {t("lock")}
                      </Button>
                    ) : null}
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
