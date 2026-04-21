"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/base-data/select-field";
import { TARGET_TYPES } from "@/lib/survey-builder/utils";

export type SurveyAppliedFilters = {
  status: string;
  targetType: string;
  activity: string;
};

const emptyFilters: SurveyAppliedFilters = {
  status: "",
  targetType: "",
  activity: "",
};

type SurveyFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: SurveyAppliedFilters;
  onApply: (filters: SurveyAppliedFilters) => void;
};

export function SurveyFiltersDialog({
  open,
  onOpenChange,
  applied,
  onApply,
}: SurveyFiltersDialogProps) {
  const tFilters = useTranslations("survey.filters");
  const tBadge = useTranslations("survey.list.statusBadge");
  const tStatus = useTranslations("community.members.options.status");
  const tTargetType = useTranslations("survey.settings.targetType");

  const [draft, setDraft] = useState<SurveyAppliedFilters>(applied);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset draft when the dialog transitions from closed to open.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(applied);
  }

  const clearAndApply = () => {
    setDraft({ ...emptyFilters });
    onApply(emptyFilters);
  };

  const SURVEY_STATUS_OPTIONS = useMemo(
    () => [
      { value: "DRAFT", label: tBadge("draft") },
      { value: "PUBLISHED", label: tBadge("published") },
    ],
    [tBadge]
  );

  const ACTIVITY_OPTIONS = useMemo(
    () => [
      { value: "ACTIVE", label: tStatus("active") },
      { value: "INACTIVE", label: tStatus("inactive") },
    ],
    [tStatus]
  );

  const targetTypeOptions = useMemo(
    () =>
      TARGET_TYPES.map((item) => ({
        value: item.value,
        label: tTargetType(
          item.value as "MEMBER" | "SELF_HELP_GROUP" | "CLUSTER" | "FEDERATION"
        ),
      })),
    [tTargetType]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,32rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>{tFilters("title")}</DialogTitle>
          <DialogDescription>{tFilters("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="survey-filter-status">{tFilters("status")}</Label>
              <SelectField
                id="survey-filter-status"
                value={draft.status}
                placeholder={tFilters("statusAll")}
                options={SURVEY_STATUS_OPTIONS}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="survey-filter-target-type">{tFilters("targetType")}</Label>
              <SelectField
                id="survey-filter-target-type"
                value={draft.targetType}
                placeholder={tFilters("targetTypeAll")}
                options={targetTypeOptions}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, targetType: value }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="survey-filter-activity">{tFilters("activity")}</Label>
              <SelectField
                id="survey-filter-activity"
                value={draft.activity}
                placeholder={tFilters("activityAll")}
                options={ACTIVITY_OPTIONS}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, activity: value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="min-h-11" onClick={clearAndApply}>
            {tFilters("clear")}
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onApply(draft)}
          >
            {tFilters("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
