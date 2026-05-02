"use client";

import { useMemo, useState } from "react";
import { UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import { PaginationRow } from "@/components/base-data/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveySubmissionAnswer, SurveySubmissionRecord } from "@/lib/api/surveys";
import type { JsonQuestionConfig, NumberQuestionConfig } from "@/lib/survey-builder/types";
import {
  useSaveSurveySubmissionAnswerMutation,
  useSubmitSurveySubmissionMutation,
  useUpdateSurveySubmissionAnswerMutation,
} from "@/hooks/use-surveys";

import { QuestionAnswerEditor } from "@/components/survey/workspace/question-answer-editor";
import { SubmissionStatusBadge } from "@/components/survey/workspace/submission-status-badge";
import type { AnswerDraft, WorkspaceQuestion } from "@/components/survey/workspace/types";
import {
  buildSubmissionAnswerPayload,
  formatDateTime,
  getInitialDraftFromQuestion,
  isQuestionAnswered,
} from "@/components/survey/workspace/utils";

export type QuestionTemplate = {
  key: string;
  questionId?: string;
  questionText: string;
  questionType: string;
  questionConfig?: JsonQuestionConfig | NumberQuestionConfig;
  options: Array<{ id?: string; text: string; isExclusive?: boolean }>;
};

const ANSWERS_PAGE_SIZE = 6;

export function SurveySubmissionAnswerWorkspace({
  submission,
  targetLabelSingular,
  questionTemplates,
  onBackToTable,
  onSubmissionUpdated,
}: {
  submission: SurveySubmissionRecord;
  targetLabelSingular?: string;
  questionTemplates: QuestionTemplate[];
  onBackToTable: () => void;
  onSubmissionUpdated?: () => Promise<unknown> | void;
}) {
  const t = useTranslations("survey.workspace");
  const tTargetLabels = useTranslations("survey.submissions.targetLabels");
  const resolvedTargetLabel = targetLabelSingular ?? tTargetLabels("memberSingular");
  const [draftOverrides, setDraftOverrides] = useState<Record<string, Partial<AnswerDraft>>>({});
  const [dirtyQuestionKeys, setDirtyQuestionKeys] = useState<Record<string, true>>({});
  const [answersPage, setAnswersPage] = useState(1);
  const saveAnswerMutation = useSaveSurveySubmissionAnswerMutation();
  const updateAnswerMutation = useUpdateSurveySubmissionAnswerMutation();
  const submitSubmissionMutation = useSubmitSurveySubmissionMutation();

  const questions: WorkspaceQuestion[] = useMemo(() => {
    const answerByQuestionId = new Map(
      submission.answers
        .filter((answer) => Boolean(answer.questionId))
        .map((answer) => [answer.questionId, answer] as const)
    );
    const baseQuestions = questionTemplates.map((template) => ({
      key: template.key,
      answer: template.questionId ? answerByQuestionId.get(template.questionId) : undefined,
      questionId: template.questionId,
      questionText: template.questionText,
      questionType: template.questionType,
      questionConfig: template.questionConfig,
      options: template.options,
    }));
    const knownQuestionIds = new Set(
      questionTemplates.map((template) => template.questionId).filter((id): id is string => Boolean(id))
    );
    const orphanAnswers = submission.answers
      .filter((answer) => !knownQuestionIds.has(answer.questionId))
      .map((answer: SurveySubmissionAnswer) => ({
        key: answer.id,
        answer,
        questionId: answer.questionId,
        questionText: answer.questionText,
        questionType: answer.questionType,
        questionConfig: undefined,
        options: answer.selectedOptions.map((option) => ({
          id: option.optionId,
          text: option.optionText,
          isExclusive: false,
        })),
      }));
    return [...baseQuestions, ...orphanAnswers];
  }, [questionTemplates, submission.answers]);

  const totalQuestions = questions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / ANSWERS_PAGE_SIZE));
  const currentPage = Math.min(answersPage, totalPages);
  const startIndex = (currentPage - 1) * ANSWERS_PAGE_SIZE;
  const pageQuestions = questions.slice(startIndex, startIndex + ANSWERS_PAGE_SIZE);

  const getDraft = (question: WorkspaceQuestion): AnswerDraft => {
    return {
      ...getInitialDraftFromQuestion(question),
      ...(draftOverrides[question.key] ?? {}),
    };
  };

  const updateDraft = (questionKey: string, patch: Partial<AnswerDraft>) => {
    setDraftOverrides((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] ?? {}),
        ...patch,
      },
    }));
    setDirtyQuestionKeys((prev) => ({
      ...prev,
      [questionKey]: true,
    }));
  };

  const isSaving = saveAnswerMutation.isPending || updateAnswerMutation.isPending;
  const isSubmitting = submitSubmissionMutation.isPending;
  const dirtyCount = Object.keys(dirtyQuestionKeys).length;
  const displayTargetName =
    submission.targetName || submission.memberName || t("unknownTarget", { target: resolvedTargetLabel });
  const allQuestionsCompleted = questions.every((question) => isQuestionAnswered(question, getDraft(question)));

  const persistDirtyAnswers = async () => {
    const dirtyKeys = Object.keys(dirtyQuestionKeys);
    if (dirtyKeys.length === 0) return;

    for (const questionKey of dirtyKeys) {
      const question = questions.find((item) => item.key === questionKey);
      if (!question) continue;
      const draft = getDraft(question);
      const payload = buildSubmissionAnswerPayload(question, draft);
      if (!payload) continue;

      if (question.answer?.id) {
        await updateAnswerMutation.mutateAsync({
          submissionId: submission.id,
          answerId: question.answer.id,
          payload,
        });
      } else {
        await saveAnswerMutation.mutateAsync({
          submissionId: submission.id,
          payload,
        });
      }
    }

    setDirtyQuestionKeys({});
    if (onSubmissionUpdated) await onSubmissionUpdated();
  };

  const handleSaveChanges = async () => {
    try {
      await persistDirtyAnswers();
      sileo.success({
        title: t("toasts.savedTitle"),
        description: t("toasts.savedMessage"),
      });
    } catch (error) {
      sileo.error({
        title: t("toasts.saveErrorTitle"),
        description: error instanceof Error ? error.message : t("toasts.unexpected"),
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!allQuestionsCompleted) {
        sileo.warning({
          title: t("toasts.incompleteTitle"),
          description: t("toasts.incompleteMessage"),
        });
        return;
      }
      await persistDirtyAnswers();
      const result = await submitSubmissionMutation.mutateAsync(submission.id);
      if (onSubmissionUpdated) await onSubmissionUpdated();
      sileo.success({
        title: t("toasts.submittedTitle"),
        description: result.message || t("toasts.submittedMessage"),
      });
    } catch (error) {
      sileo.error({
        title: t("toasts.submitErrorTitle"),
        description: error instanceof Error ? error.message : t("toasts.unexpected"),
      });
    }
  };

  const workspaceTitleTarget = resolvedTargetLabel[0]
    ? `${resolvedTargetLabel[0].toUpperCase()}${resolvedTargetLabel.slice(1)}`
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBackToTable}>
          {t("backToTable")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => void handleSaveChanges()}
            disabled={isSaving || isSubmitting || dirtyCount === 0}
          >
            {isSaving
              ? t("saving")
              : dirtyCount > 0
                ? t("saveChangesCount", { count: dirtyCount })
                : t("saveChanges")}
          </Button>
          {currentPage === totalPages ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSubmit()}
              disabled={isSaving || isSubmitting || !allQuestionsCompleted}
            >
              {isSubmitting ? t("submitting") : t("submitSubmission")}
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle>
            {workspaceTitleTarget
              ? t("responseWorkspaceTitled", { target: workspaceTitleTarget })
              : t("responseWorkspace")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/10 bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <UserRoundIcon className="size-4 text-muted-foreground" />
                  {displayTargetName}
                </p>
              </div>
              <SubmissionStatusBadge status={submission.submissionStatus} />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <p>{t("started", { value: formatDateTime(submission.startedAt) })}</p>
              <p>{t("submittedAt", { value: formatDateTime(submission.submittedAt) })}</p>
              <p>{t("totalQuestions", { count: totalQuestions || submission.totalQuestions })}</p>
              <p>{t("answered", { count: submission.answeredQuestions })}</p>
            </div>
          </div>

          {pageQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-primary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              {t("noQuestions")}
            </div>
          ) : (
            <div className="space-y-3">
              {pageQuestions.map((question, index) => (
                <QuestionAnswerEditor
                  key={question.key}
                  question={question}
                  index={startIndex + index}
                  draft={getDraft(question)}
                  onDraftChange={(patch) => updateDraft(question.key, patch)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <PaginationRow
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalQuestions}
              onPrev={() => setAnswersPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setAnswersPage((prev) => Math.min(totalPages, prev + 1))}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
