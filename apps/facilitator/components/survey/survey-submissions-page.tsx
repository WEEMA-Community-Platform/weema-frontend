"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type QuestionTemplate } from "@/components/survey/survey-submission-answer-workspace";
import { SubmissionWorkspacePanel } from "@/components/survey/survey-submission-workspace-panel";
import {
  AssignedTargetsTableCard,
  MemberSubmissionsTableCard,
} from "@/components/survey/survey-submissions-tables";
import {
  useSurveyAssignmentTargetsQuery,
  useSurveyDetailQuery,
  useSurveySubmissionDetailQuery,
  useSurveySubmissionsByAssignmentQuery,
} from "@/hooks/use-surveys";
import type { SurveyAssignmentTargetRow, SurveySubmissionRecord } from "@/lib/api/surveys";
import { normalizeSurveyResponse } from "@/lib/survey-builder/normalize";

export function SurveySubmissionsPage({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const surveyTitle = searchParams.get("surveyTitle")?.trim() || "Selected survey";
  const selectedSubmissionId = searchParams.get("submissionId");
  const selectedAssignmentId = searchParams.get("assignmentId");
  const selectedAssignmentName = searchParams.get("assignmentName")?.trim() || "";

  const assignmentTargetsQuery = useSurveyAssignmentTargetsQuery(surveyId);
  const assignedTargets = assignmentTargetsQuery.data?.assignmentData?.assignedTargets ?? [];
  const submissionsQuery = useSurveySubmissionsByAssignmentQuery(selectedAssignmentId, {
    enabled: !!selectedAssignmentId,
  });
  const submissions = submissionsQuery.data?.submissions ?? [];

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

  const setRouteSearch = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const chooseAssignment = (target: SurveyAssignmentTargetRow) => {
    if (!target.assignmentId) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("assignmentId", target.assignmentId);
    next.set("assignmentName", target.name || "Self Help Group");
    next.delete("submissionId");
    next.delete("memberName");
    next.delete("view");
    setRouteSearch(next);
  };

  const openAnswerWorkspace = (submission: SurveySubmissionRecord) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("submissionId", submission.id);
    next.set("memberName", submission.memberName || "Member");
    next.set("view", "answers");
    setRouteSearch(next);
  };

  const backToTable = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("submissionId");
    next.delete("memberName");
    next.delete("view");
    setRouteSearch(next);
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
        <SubmissionWorkspacePanel
          selectedSubmissionId={selectedSubmissionId}
          loading={detailQuery.isLoading || surveyDetailQuery.isLoading}
          isError={detailQuery.isError}
          errorMessage={detailQuery.error instanceof Error ? detailQuery.error.message : undefined}
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
          <AssignedTargetsTableCard
            surveyTitle={surveyTitle}
            targets={assignedTargets}
            loading={assignmentTargetsQuery.isLoading}
            isError={assignmentTargetsQuery.isError}
            errorMessage={
              assignmentTargetsQuery.error instanceof Error
                ? assignmentTargetsQuery.error.message
                : "Failed to load survey assignment targets."
            }
            onRetry={() => assignmentTargetsQuery.refetch()}
            onChooseAssignment={chooseAssignment}
          />

          <MemberSubmissionsTableCard
            selectedAssignmentId={selectedAssignmentId}
            selectedAssignmentName={selectedAssignmentName}
            submissions={submissions}
            loading={submissionsQuery.isLoading}
            isError={submissionsQuery.isError}
            errorMessage={
              submissionsQuery.error instanceof Error
                ? submissionsQuery.error.message
                : "Failed to load submissions."
            }
            onRetry={() => submissionsQuery.refetch()}
            onViewAnswers={openAnswerWorkspace}
          />
        </>
      )}
    </div>
  );
}
