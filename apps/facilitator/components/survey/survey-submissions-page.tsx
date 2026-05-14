"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { type QuestionTemplate } from "@/components/survey/survey-submission-answer-workspace";
import { type SectionTemplate } from "@/components/survey/survey-submission-answer-workspace";
import { SubmissionWorkspacePanel } from "@/components/survey/survey-submission-workspace-panel";
import {
  MemberSubmissionsTableCard,
} from "@/components/survey/survey-submissions-tables";
import {
  useSurveyAssignmentTargetsQuery,
  useSurveyPendingTargetsByAssigneeQuery,
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
  surveyTargetType,
}: {
  surveyId: string;
  surveyTargetType: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tPage = useTranslations("survey.submissions");
  const labelsForTargetType = useLabelsForTargetType();
  const selectedSubmissionId = searchParams.get("submissionId");
  const activeTab = searchParams.get("tab") === "start" ? "start" : "submissions";

  const submissionsQuery = useSurveySubmissionsBySurveyQuery(surveyId);
  const assignmentTargetsQuery = useSurveyAssignmentTargetsQuery(surveyId, {
    enabled: Boolean(surveyId) && !selectedSubmissionId,
  });
  const submissionFiltersEligible = surveyTargetType.trim().toUpperCase() === "MEMBER";
  const assigneeOptions = useMemo(() => {
    if (!submissionFiltersEligible) return [];
    const byId = new Map<string, string>();
    const ad = assignmentTargetsQuery.data?.assignmentData;
    const assigned = ad?.assignedTargets ?? [];
    for (const row of assigned) {
      byId.set(row.id, row.name);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assignmentTargetsQuery.data?.assignmentData, submissionFiltersEligible]);
  const resolvedAssigneeId = assigneeOptions[0]?.id ?? null;
  const pendingTargetsQuery = useSurveyPendingTargetsByAssigneeQuery(
    surveyId,
    submissionFiltersEligible ? resolvedAssigneeId : null,
    {
      enabled:
        Boolean(surveyId) &&
        !selectedSubmissionId &&
        activeTab === "start" &&
        submissionFiltersEligible &&
        Boolean(resolvedAssigneeId),
    }
  );
  const submissions = submissionsQuery.data?.submissions ?? [];
  const pendingSubmissions = pendingTargetsQuery.data?.submissions ?? [];

  const detailQuery = useSurveySubmissionDetailQuery(selectedSubmissionId, { enabled: !!selectedSubmissionId });
  const selectedSubmission = detailQuery.data?.submission ?? null;
  const surveyDetailQuery = useSurveyDetailQuery(surveyId);
  const primaryTargetType = submissions[0]?.targetType;
  const surveyTargetTypeFromDetail = surveyDetailQuery.data?.survey?.targetType;
  const targetTypeForLabels =
    surveyTargetType.trim() || surveyTargetTypeFromDetail || primaryTargetType;
  const targetLabels = labelsForTargetType(targetTypeForLabels);
  const targetLabelSingular = targetLabels.singular;
  const targetLabelPlural = targetLabels.plural;
  const startSubmissionMutation = useStartSurveySubmissionMutation();

  const sectionTemplates: SectionTemplate[] = (() => {
    const backendSurvey = surveyDetailQuery.data?.survey;
    if (!backendSurvey) return [];
    const normalized = normalizeSurveyResponse(backendSurvey);
    return normalized.sections.map((section) => ({
      key: section.id ?? section.clientId,
      skipConditions: section.skipConditions.map((condition) => ({
        parentQuestionRef: condition.parentQuestionClientId,
        operator: condition.operator,
        optionRef: condition.optionClientId,
        expectedValue: condition.expectedValue,
        logicType: condition.logicType,
      })),
    }));
  })();

  const questionTemplates: QuestionTemplate[] = (() => {
    const backendSurvey = surveyDetailQuery.data?.survey;
    if (!backendSurvey) return [];
    const normalized = normalizeSurveyResponse(backendSurvey);
    return normalized.sections.flatMap((section) =>
      section.questions.map((question) => ({
        key: question.id ?? question.clientId,
        questionId: question.id,
        questionClientId: question.clientId,
        sectionKey: section.id ?? section.clientId,
        questionText: question.questionText,
        questionType: question.questionType,
        questionConfig: question.questionConfig,
        options: question.options.map((option) => ({
          id: option.id,
          clientId: option.clientId,
          text: option.text,
          isExclusive: Boolean(option.isExclusive),
        })),
        showConditions: question.showConditions.map((condition) => ({
          parentQuestionRef: condition.parentQuestionClientId,
          operator: condition.operator,
          optionRef: condition.optionClientId,
          expectedValue: condition.expectedValue,
          logicType: condition.logicType,
        })),
      }))
    );
  })();

  const setRouteSearch = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setActiveTab = (nextTab: "submissions" | "start") => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    next.delete("submissionId");
    next.delete("targetName");
    next.delete("memberName");
    next.delete("view");
    setRouteSearch(next);
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
        {submissionFiltersEligible && !selectedSubmissionId ? (
          <div className="inline-flex items-center rounded-xl border border-primary/20 bg-background p-1">
            <div className="inline-flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                  activeTab === "submissions"
                    ? "border border-primary/25 bg-primary/12 text-primary"
                    : "border border-transparent text-muted-foreground hover:bg-primary/8 hover:text-primary"
                }`}
                onClick={() => setActiveTab("submissions")}
              >
                {tPage("tabs.submissions")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                  activeTab === "start"
                    ? "border border-primary/25 bg-primary/12 text-primary"
                    : "border border-transparent text-muted-foreground hover:bg-primary/8 hover:text-primary"
                }`}
                onClick={() => setActiveTab("start")}
              >
                {tPage("tabs.startSubmission")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedSubmissionId ? (
        <SubmissionWorkspacePanel
          selectedSubmissionId={selectedSubmissionId}
          loading={detailQuery.isLoading || surveyDetailQuery.isLoading}
          isError={detailQuery.isError}
          errorMessage={detailQuery.error instanceof Error ? detailQuery.error.message : undefined}
          targetLabelSingular={targetLabelSingular}
          selectedSubmission={selectedSubmission}
          sectionTemplates={sectionTemplates}
          questionTemplates={questionTemplates}
          onRetry={() => detailQuery.refetch()}
          onBackToTable={backToTable}
          onSubmissionUpdated={async () => {
            await Promise.all([
              detailQuery.refetch(),
              submissionsQuery.refetch(),
              pendingTargetsQuery.refetch(),
            ]);
          }}
        />
      ) : activeTab === "start" ? (
        <MemberSubmissionsTableCard
          titleOverride={tPage("pending.title")}
          emptyMessageOverride={
            resolvedAssigneeId
              ? tPage("pending.empty")
              : tPage("pending.selectAssignee")
          }
          targetLabelSingular={targetLabelSingular}
          targetLabelPlural={targetLabelPlural}
          submissions={pendingSubmissions}
          loading={pendingTargetsQuery.isLoading}
          isError={pendingTargetsQuery.isError}
          errorMessage={
            pendingTargetsQuery.error instanceof Error
              ? pendingTargetsQuery.error.message
              : tPage("pending.loadError")
          }
          onRetry={() => pendingTargetsQuery.refetch()}
          onPrimaryAction={(submission) => void handlePrimaryAction(submission)}
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
