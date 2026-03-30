"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, RefreshCcwDotIcon } from "lucide-react";

import {
  EmptyStateRow,
  TableShell,
  tableActionsCellClass,
  tableRowActionsClass,
} from "@/components/base-data/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  SurveySubmissionAnswerWorkspace,
  type QuestionTemplate,
} from "@/components/survey/survey-submission-answer-workspace";
import {
  useSurveyDetailQuery,
  useSurveySubmissionDetailQuery,
  useSurveySubmissionsBySurveyQuery,
} from "@/hooks/use-surveys";
import type { SurveySubmissionRecord } from "@/lib/api/surveys";
import { normalizeSurveyResponse } from "@/lib/survey-builder/normalize";

function formatDateTime(value: string | null | undefined) {
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

function SubmissionStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  if (normalized === "FINISHED" || normalized === "SUBMITTED") {
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

export function SurveySubmissionsPage({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const surveyTitleFromQuery = searchParams.get("surveyTitle")?.trim() || "";
  const selectedSubmissionId = searchParams.get("submissionId");

  const submissionsQuery = useSurveySubmissionsBySurveyQuery(surveyId);
  const submissions = submissionsQuery.data?.submissions ?? [];
  const surveyTitle =
    surveyTitleFromQuery || submissions[0]?.surveyTitle?.trim() || "Selected survey";

  const detailQuery = useSurveySubmissionDetailQuery(selectedSubmissionId, { enabled: !!selectedSubmissionId });
  const selectedSubmission = detailQuery.data?.submission ?? null;
  const surveyDetailQuery = useSurveyDetailQuery(surveyId, { enabled: !!selectedSubmissionId });
  const questionTemplates: QuestionTemplate[] = (() => {
    const backendSurvey = surveyDetailQuery.data?.survey;
    if (!backendSurvey) return [];
    const normalized = normalizeSurveyResponse(backendSurvey);
    return normalized.sections.flatMap((section) =>
      section.questions.map((question) => ({
        key: question.id ?? question.clientId,
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        questionConfig: question.questionConfig,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      }))
    );
  })();

  const openAnswerWorkspace = (submission: SurveySubmissionRecord) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("submissionId", submission.id);
    next.set("memberName", submission.memberName || "Member");
    next.set("view", "answers");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const backToTable = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("submissionId");
    next.delete("memberName");
    next.delete("view");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" render={<Link href="/survey" />}>
          <ArrowLeftIcon className="size-4" />
          Back to surveys
        </Button>
      </div>

      {selectedSubmissionId ? (
        detailQuery.isLoading || surveyDetailQuery.isLoading ? (
          <Card className="border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle>
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <RefreshCcwDotIcon className="size-4 animate-spin" />
                  Loading submission details...
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </CardContent>
          </Card>
        ) : detailQuery.isError ? (
          <div className="space-y-3 rounded-lg border border-primary/10 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Failed to load submission details."}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => detailQuery.refetch()}>
                Retry
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={backToTable}>
                Back to submissions table
              </Button>
            </div>
          </div>
        ) : !selectedSubmission ? (
          <div className="space-y-3 rounded-lg border border-primary/10 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Submission not found.</p>
            <Button type="button" variant="outline" size="sm" onClick={backToTable}>
              Back to submissions table
            </Button>
          </div>
        ) : (
          <SurveySubmissionAnswerWorkspace
            key={selectedSubmission.id}
            submission={selectedSubmission}
            questionTemplates={questionTemplates}
            onBackToTable={backToTable}
            onSubmissionUpdated={async () => {
              await Promise.all([
                detailQuery.refetch(),
                submissionsQuery.refetch(),
              ]);
            }}
          />
        )
      ) : (
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle>Submissions for {surveyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TableShell
              headers={["Member", "Status", "Progress", "Submitted", "Actions"]}
              loading={submissionsQuery.isLoading}
              loadingColumnCount={5}
              isError={submissionsQuery.isError}
              errorMessage={
                submissionsQuery.error instanceof Error
                  ? submissionsQuery.error.message
                  : "Failed to load submissions."
              }
              onRetry={() => submissionsQuery.refetch()}
              emptyState={<EmptyStateRow colSpan={5} message="No submissions yet for this survey." />}
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
                    <TableCell className="text-sm"><SubmissionStatusBadge status={submission.submissionStatus} /></TableCell>
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
                      {formatDateTime(submission.submittedAt)}
                    </TableCell>
                    <TableCell className={tableActionsCellClass}>
                      <div className={tableRowActionsClass}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => openAnswerWorkspace(submission)}
                        >
                          View answers
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableShell>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
