"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { type QuestionTemplate } from "@/components/survey/survey-submission-answer-workspace";
import { SubmissionWorkspacePanel } from "@/components/survey/survey-submission-workspace-panel";
import {
  MemberSubmissionsTableCard,
} from "@/components/survey/survey-submissions-tables";
import {
  useStartSurveySubmissionMutation,
  useSurveyDetailQuery,
  useSurveySubmissionDetailQuery,
  useSurveySubmissionsBySurveyQuery,
} from "@/hooks/use-surveys";
import type { SurveySubmissionRecord } from "@/lib/api/surveys";
import { normalizeSurveyResponse } from "@/lib/survey-builder/normalize";

function useLabelsForTargetType() {
  const t = useTranslations("survey.submissions.targetLabels");
  return (targetType: string | undefined) => {
    const normalized = (targetType ?? "").toUpperCase();
    if (normalized === "CLUSTER" || normalized === "SELF_HELP_GROUP") {
      return { singular: t("shgSingular"), plural: t("shgPlural") };
    }
    if (normalized === "FEDERATION")
      return { singular: t("clusterSingular"), plural: t("clusterPlural") };
    if (normalized === "MEMBER")
      return { singular: t("memberSingular"), plural: t("memberPlural") };
    return { singular: t("genericSingular"), plural: t("genericPlural") };
  };
}

function isNotStartedStatus(status?: string | null) {
  const normalized = (status ?? "NOT_STARTED").toUpperCase();
  return normalized === "NOT_STARTED" || normalized === "NOT STARTED" || normalized === "PENDING";
}

export function SurveySubmissionsPage({
  surveyId,
  initialTargetType,
}: {
  surveyId: string;
  initialTargetType?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tPage = useTranslations("survey.submissions");
  const labelsForTargetType = useLabelsForTargetType();
  const selectedSubmissionId = searchParams.get("submissionId");
  const targetTypeFromQuery = searchParams.get("targetType") || initialTargetType;

  const submissionsQuery = useSurveySubmissionsBySurveyQuery(surveyId);
  const submissions = submissionsQuery.data?.submissions ?? [];

  const detailQuery = useSurveySubmissionDetailQuery(selectedSubmissionId, { enabled: !!selectedSubmissionId });
  const selectedSubmission = detailQuery.data?.submission ?? null;
  const surveyDetailQuery = useSurveyDetailQuery(surveyId);
  const primaryTargetType = submissions[0]?.targetType;
  const surveyTargetType = surveyDetailQuery.data?.survey?.targetType;
  const targetLabels = labelsForTargetType(targetTypeFromQuery ?? primaryTargetType ?? surveyTargetType);
  const targetLabelSingular = targetLabels.singular;
  const targetLabelPlural = targetLabels.plural;
  const startSubmissionMutation = useStartSurveySubmissionMutation();

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

  const setRouteSearch = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const openAnswerWorkspace = (submission: SurveySubmissionRecord) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("submissionId", submission.id);
    next.set("targetName", submission.targetName || submission.memberName || targetLabelSingular);
    next.delete("memberName");
    next.set("view", "answers");
    setRouteSearch(next);
  };

  const handlePrimaryAction = async (submission: SurveySubmissionRecord) => {
    if (!isNotStartedStatus(submission.submissionStatus)) {
      openAnswerWorkspace(submission);
      return;
    }

    const targetId = submission.targetId || submission.memberId;
    if (!targetId) return;

    try {
      const started = await startSubmissionMutation.mutateAsync({ surveyId, targetId });
      openAnswerWorkspace({ ...submission, ...started, id: started.id });
    } catch {
      // errors are surfaced by API layer toasts elsewhere
    }
  };

  const backToTable = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("submissionId");
    next.delete("targetName");
    next.delete("memberName");
    next.delete("view");
    setRouteSearch(next);
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" render={<Link href="/survey" />}>
          <ArrowLeftIcon className="size-4" />
          {tPage("backToSurveys")}
        </Button>
      </div>

      {selectedSubmissionId ? (
        <SubmissionWorkspacePanel
          selectedSubmissionId={selectedSubmissionId}
          loading={detailQuery.isLoading || surveyDetailQuery.isLoading}
          isError={detailQuery.isError}
          errorMessage={detailQuery.error instanceof Error ? detailQuery.error.message : undefined}
          targetLabelSingular={targetLabelSingular}
          selectedSubmission={selectedSubmission}
          questionTemplates={questionTemplates}
          onRetry={() => detailQuery.refetch()}
          onBackToTable={backToTable}
          onSubmissionUpdated={async () => {
            await Promise.all([detailQuery.refetch(), submissionsQuery.refetch()]);
          }}
        />
      ) : (
        <>
          <MemberSubmissionsTableCard
            targetLabelSingular={targetLabelSingular}
            targetLabelPlural={targetLabelPlural}
            submissions={submissions}
            loading={submissionsQuery.isLoading}
            isError={submissionsQuery.isError}
            errorMessage={
              submissionsQuery.error instanceof Error
                ? submissionsQuery.error.message
                : tPage("loadError")
            }
            onRetry={() => submissionsQuery.refetch()}
            onPrimaryAction={(submission) => void handlePrimaryAction(submission)}
          />
        </>
      )}
    </div>
  );
}
