"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, LockIcon, UnlockIcon } from "lucide-react";
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
  useUnlockSurveySubmissionMutation,
  useSurveyDetailQuery,
  useSurveySubmissionDetailQuery,
  useSurveySubmissionsBySurveyQuery,
} from "@/hooks/use-surveys";
import type { SurveySubmissionRecord } from "@/lib/api/surveys";
import { normalizeSurveyResponse } from "@/lib/survey-builder/normalize";

type PendingSubmissionLock = { submission: SurveySubmissionRecord; action: "lock" | "unlock" };

function SubmissionLockDialog({
  pending,
  open,
  lockMutation,
  unlockMutation,
  onClose,
}: {
  pending: PendingSubmissionLock | null;
  open: boolean;
  lockMutation: ReturnType<typeof useLockSurveySubmissionMutation>;
  unlockMutation: ReturnType<typeof useUnlockSurveySubmissionMutation>;
  onClose: () => void;
}) {
  // Retain last non-null values so content doesn't flash during the exit animation.
  const lastPending = useRef(pending);
  if (pending) lastPending.current = pending;
  const p = lastPending.current;
  const isLocking = p?.action === "lock";
  const isPending = lockMutation.isPending || unlockMutation.isPending;

  const handleConfirm = async () => {
    if (!p?.submission.id) return;
    try {
      if (isLocking) {
        await lockMutation.mutateAsync(p.submission.id);
        sileo.success({
          title: "Submission locked",
          description: `${p.submission.memberName}'s submission has been locked.`,
        });
      } else {
        await unlockMutation.mutateAsync(p.submission.id);
        sileo.success({
          title: "Submission unlocked",
          description: `${p.submission.memberName}'s submission has been unlocked.`,
        });
      }
      onClose();
    } catch (error) {
      sileo.error({
        title: isLocking ? "Failed to lock submission" : "Failed to unlock submission",
        description: error instanceof Error ? error.message : "Unexpected error",
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
            {isLocking ? "Lock submission" : "Unlock submission"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLocking ? (
              <>
                Lock{" "}
                <span className="font-semibold text-foreground">
                  {p?.submission.memberName ?? "this member"}
                </span>
                {"'s submission? Facilitators will not be able to edit or delete it."}
              </>
            ) : (
              <>
                Unlock{" "}
                <span className="font-semibold text-foreground">
                  {p?.submission.memberName ?? "this member"}
                </span>
                {"'s submission? Facilitators will be able to edit or delete it again."}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
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
              isLocking ? "Locking..." : "Unlocking..."
            ) : (
              <>
                {isLocking ? <LockIcon className="size-4" /> : <UnlockIcon className="size-4" />}
                {isLocking ? "Lock submission" : "Unlock submission"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SurveySubmissionsPage({ surveyId }: { surveyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const surveyTitle = searchParams.get("surveyTitle")?.trim() || "Selected survey";
  const selectedSubmissionId = searchParams.get("submissionId");

  const [pendingSubmissionLock, setPendingSubmissionLock] = useState<PendingSubmissionLock | null>(null);

  const submissionsQuery = useSurveySubmissionsBySurveyQuery(surveyId);
  const submissions = submissionsQuery.data?.submissions ?? [];

  const detailQuery = useSurveySubmissionDetailQuery(selectedSubmissionId, { enabled: !!selectedSubmissionId });
  const selectedSubmission = detailQuery.data?.submission ?? null;
  const surveyDetailQuery = useSurveyDetailQuery(surveyId, { enabled: !!selectedSubmissionId });

  const lockSubmissionMutation = useLockSurveySubmissionMutation();
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
          <MemberSubmissionsTableCard
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
        onClose={() => setPendingSubmissionLock(null)}
      />
    </div>
  );
}
