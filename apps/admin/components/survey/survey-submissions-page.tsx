"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, LockIcon, UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type QuestionTemplate } from "@/components/survey/survey-submission-answer-workspace";
import { SubmissionWorkspacePanel } from "@/components/survey/survey-submission-workspace-panel";
import {
  MemberSubmissionsTableCard,
} from "@/components/survey/survey-submissions-tables";
import {
  useLockSurveySubmissionMutation,
  useStartSurveySubmissionMutation,
  useUnlockSurveySubmissionMutation,
  useSurveyDetailQuery,
  useSurveySubmissionDetailQuery,
  useSurveySubmissionsBySurveyQuery,
} from "@/hooks/use-surveys";
import type { SurveySubmissionRecord } from "@/lib/api/surveys";
import { normalizeSurveyResponse } from "@/lib/survey-builder/normalize";

type PendingSubmissionLock = { submission: SurveySubmissionRecord; action: "lock" | "unlock" };

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

function SubmissionLockDialog({
  pending,
  open,
  lockMutation,
  unlockMutation,
  targetLabelSingular,
  onUpdated,
  onClose,
}: {
  pending: PendingSubmissionLock | null;
  open: boolean;
  lockMutation: ReturnType<typeof useLockSurveySubmissionMutation>;
  unlockMutation: ReturnType<typeof useUnlockSurveySubmissionMutation>;
  targetLabelSingular: string;
  onUpdated: () => Promise<void>;
  onClose: () => void;
}) {
  const tLock = useTranslations("survey.submissions.lock");
  const tToasts = useTranslations("survey.submissions.lock.toasts");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");
  // Retain last non-null values so content doesn't flash during the exit animation.
  const [latchedPending, setLatchedPending] = useState<PendingSubmissionLock | null>(pending);
  if (pending && pending !== latchedPending) setLatchedPending(pending);
  const p = latchedPending;
  const isLocking = p?.action === "lock";
  const isPending = lockMutation.isPending || unlockMutation.isPending;
  const targetName =
    p?.submission.targetName ||
    p?.submission.memberName ||
    tLock("thisTarget", { target: targetLabelSingular });

  const handleConfirm = async () => {
    if (!p?.submission.id) return;
    try {
      if (isLocking) {
        await lockMutation.mutateAsync(p.submission.id);
        sileo.success({
          title: tToasts("lockedTitle"),
          description: tToasts("lockedMessage", { name: targetName }),
        });
      } else {
        await unlockMutation.mutateAsync(p.submission.id);
        sileo.success({
          title: tToasts("unlockedTitle"),
          description: tToasts("unlockedMessage", { name: targetName }),
        });
      }
      await onUpdated();
      onClose();
    } catch (error) {
      sileo.error({
        title: isLocking
          ? tToasts("lockErrorTitle")
          : tToasts("unlockErrorTitle"),
        description:
          error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isLocking ? (
              <LockIcon className="size-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <UnlockIcon className="size-4 text-amber-500" />
            )}
            {isLocking ? tLock("lockTitle") : tLock("unlockTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLocking
              ? tLock.rich("lockDescription", {
                  name: targetName,
                  strong: (chunks) => (
                    <span className="font-semibold text-foreground">{chunks}</span>
                  ),
                })
              : tLock.rich("unlockDescription", {
                  name: targetName,
                  strong: (chunks) => (
                    <span className="font-semibold text-foreground">{chunks}</span>
                  ),
                })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tActions("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleConfirm()}
            disabled={isPending}
            className={
              isLocking
                ? "bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                : "bg-amber-600 hover:bg-amber-500"
            }
          >
            {isPending ? (
              isLocking ? tLock("locking") : tLock("unlocking")
            ) : (
              <>
                {isLocking ? <LockIcon className="size-4" /> : <UnlockIcon className="size-4" />}
                {isLocking ? tLock("lockSubmit") : tLock("unlockSubmit")}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
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
  const tToasts = useTranslations("survey.submissions.lock.toasts");
  const tValidation = useTranslations("common.validation");
  const labelsForTargetType = useLabelsForTargetType();
  const selectedSubmissionId = searchParams.get("submissionId");
  const targetTypeFromQuery = searchParams.get("targetType") || initialTargetType;

  const [pendingSubmissionLock, setPendingSubmissionLock] = useState<PendingSubmissionLock | null>(null);

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

  const lockSubmissionMutation = useLockSurveySubmissionMutation();
  const startSubmissionMutation = useStartSurveySubmissionMutation();
  const unlockSubmissionMutation = useUnlockSurveySubmissionMutation();

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
    const normalizedStatus = (submission.submissionStatus ?? "NOT_STARTED").toUpperCase();
    const isFillMode =
      normalizedStatus === "NOT_STARTED" ||
      normalizedStatus === "NOT STARTED" ||
      normalizedStatus === "PENDING";

    if (!isFillMode) {
      openAnswerWorkspace(submission);
      return;
    }

    const targetId = submission.targetId || submission.memberId;
    if (!targetId) {
      sileo.error({
        title: tToasts("unableToStartTitle"),
        description: tToasts("unableToStartMessage"),
      });
      return;
    }

    try {
      const started = await startSubmissionMutation.mutateAsync({ surveyId, targetId });
      openAnswerWorkspace({
        ...submission,
        ...started,
        id: started.id,
      });
    } catch (error) {
      sileo.error({
        title: tToasts("startFailedTitle"),
        description:
          error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
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
            onLockSubmission={(submission) =>
              setPendingSubmissionLock({ submission, action: "lock" })
            }
            onUnlockSubmission={(submission) =>
              setPendingSubmissionLock({ submission, action: "unlock" })
            }
          />
        </>
      )}

      <SubmissionLockDialog
        pending={pendingSubmissionLock}
        open={!!pendingSubmissionLock}
        lockMutation={lockSubmissionMutation}
        unlockMutation={unlockSubmissionMutation}
        targetLabelSingular={targetLabelSingular}
        onUpdated={async () => {
          await Promise.all([
            submissionsQuery.refetch(),
            selectedSubmissionId ? detailQuery.refetch() : Promise.resolve(),
          ]);
        }}
        onClose={() => setPendingSubmissionLock(null)}
      />
    </div>
  );
}
