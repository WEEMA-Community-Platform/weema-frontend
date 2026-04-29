"use client";

import Link from "next/link";
import { ArrowLeftIcon, DownloadIcon, Loader2, PlusIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { SaveAllEligibility } from "./shared";

type BuilderHeaderProps = {
  initialSurveyId: string | null;
  isTranslationMode?: boolean;
  totalQuestionCount: number;
  isCreatingSurvey: boolean;
  isSavingAllChanges: boolean;
  saveAllEligibility: SaveAllEligibility;
  onCreateNew: () => void;
  onSaveSurvey: () => void;
  onSaveAllChanges: () => void;
  onExportDetail?: () => void;
  exportDetailPending?: boolean;
  exportDetailLabel?: string;
  exportDetailPendingLabel?: string;
};

export function BuilderHeader({
  initialSurveyId,
  isTranslationMode = false,
  totalQuestionCount,
  isCreatingSurvey,
  isSavingAllChanges,
  saveAllEligibility,
  onCreateNew,
  onSaveSurvey,
  onSaveAllChanges,
  onExportDetail,
  exportDetailPending = false,
  exportDetailLabel,
  exportDetailPendingLabel,
}: BuilderHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-primary/10 px-4">
      <Button type="button" variant="ghost" render={<Link href="/survey" />}>
        <ArrowLeftIcon className="size-4" />
        Back to surveys
      </Button>

      <div className="flex items-center gap-2">
        {isTranslationMode ? (
          <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs text-primary">
            Translation mode
          </span>
        ) : null}
        <Button type="button" variant="outline" onClick={onCreateNew}>
          <PlusIcon className="size-4" />
          New survey
        </Button>

        {initialSurveyId && onExportDetail && exportDetailLabel && exportDetailPendingLabel ? (
          <Button
            type="button"
            variant="outline"
            disabled={exportDetailPending}
            onClick={onExportDetail}
          >
            {exportDetailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {exportDetailPendingLabel}
              </>
            ) : (
              <>
                <DownloadIcon className="size-4" aria-hidden />
                {exportDetailLabel}
              </>
            )}
          </Button>
        ) : null}

        {!initialSurveyId ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  className={`bg-primary text-primary-foreground hover:bg-primary/90 ${
                    totalQuestionCount === 0 ? "cursor-not-allowed opacity-60" : ""
                  }`}
                  onClick={onSaveSurvey}
                  disabled={isCreatingSurvey || isSavingAllChanges}
                  aria-disabled={totalQuestionCount === 0}
                />
              }
            >
              <SaveIcon className="size-4" />
              {isCreatingSurvey
                ? isTranslationMode
                  ? "Creating translation..."
                  : "Creating..."
                : isTranslationMode
                  ? "Create translation"
                  : "Create survey"}
            </TooltipTrigger>
            <TooltipContent>
              {totalQuestionCount === 0
                ? "Add at least one question before creating the survey."
                : isTranslationMode
                  ? "Create the translated survey from the current edits."
                  : "Create the survey with all current settings and questions."}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  className={`bg-primary text-primary-foreground hover:bg-primary/90 ${
                    !saveAllEligibility.canSaveAll ? "cursor-not-allowed opacity-60" : ""
                  }`}
                  onClick={onSaveAllChanges}
                  disabled={isSavingAllChanges}
                  aria-disabled={!saveAllEligibility.canSaveAll}
                />
              }
            >
              <SaveIcon className="size-4" />
              {isSavingAllChanges
                ? "Saving all..."
                : saveAllEligibility.canSaveAll
                  ? "Save all changes"
                  : saveAllEligibility.hasUnsavedChanges
                    ? "Save all changes"
                    : "All changes saved"}
            </TooltipTrigger>
            <TooltipContent>{saveAllEligibility.reason}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
