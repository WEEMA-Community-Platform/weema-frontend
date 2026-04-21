"use client";

import { RefreshCcwDotIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SurveySubmissionAnswerWorkspace,
  type QuestionTemplate,
} from "@/components/survey/survey-submission-answer-workspace";
import type { SurveySubmissionRecord } from "@/lib/api/surveys";

type SubmissionWorkspacePanelProps = {
  selectedSubmissionId: string | null;
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  targetLabelSingular?: string;
  selectedSubmission: SurveySubmissionRecord | null;
  questionTemplates: QuestionTemplate[];
  onRetry: () => void;
  onBackToTable: () => void;
  onSubmissionUpdated: () => Promise<void>;
};

export function SubmissionWorkspacePanel({
  selectedSubmissionId,
  loading,
  isError,
  errorMessage,
  targetLabelSingular,
  selectedSubmission,
  questionTemplates,
  onRetry,
  onBackToTable,
  onSubmissionUpdated,
}: SubmissionWorkspacePanelProps) {
  const t = useTranslations("survey.submissions.workspace");
  const tTargetLabels = useTranslations("survey.submissions.targetLabels");
  const tActions = useTranslations("common.actions");
  const resolvedTargetLabel = targetLabelSingular ?? tTargetLabels("memberSingular");

  if (!selectedSubmissionId) return null;

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle>
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <RefreshCcwDotIcon className="size-4 animate-spin" />
              {t("loading")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-primary/10 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {errorMessage || t("loadError")}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {tActions("retry")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onBackToTable}>
            {t("backToTable")}
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedSubmission) {
    return (
      <div className="space-y-3 rounded-lg border border-primary/10 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <Button type="button" variant="outline" size="sm" onClick={onBackToTable}>
          {t("backToTable")}
        </Button>
      </div>
    );
  }

  return (
    <SurveySubmissionAnswerWorkspace
      key={selectedSubmission.id}
      submission={selectedSubmission}
      targetLabelSingular={resolvedTargetLabel}
      questionTemplates={questionTemplates}
      onBackToTable={onBackToTable}
      onSubmissionUpdated={onSubmissionUpdated}
    />
  );
}
