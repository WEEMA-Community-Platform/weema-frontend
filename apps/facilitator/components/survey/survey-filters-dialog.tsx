"use client";

import { useEffect, useState } from "react";

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

const SURVEY_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

const ACTIVITY_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

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
  const [draft, setDraft] = useState<SurveyAppliedFilters>(applied);

  useEffect(() => {
    if (open) {
      setDraft(applied);
    }
  }, [open, applied]);

  const clearAndApply = () => {
    setDraft({ ...emptyFilters });
    onApply(emptyFilters);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,32rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Filter surveys</DialogTitle>
          <DialogDescription>
            Narrow the list by lifecycle status, target type, and activity state. Changes apply when
            you click Apply filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="survey-filter-status">Status</Label>
              <SelectField
                id="survey-filter-status"
                value={draft.status}
                placeholder="All statuses"
                options={SURVEY_STATUS_OPTIONS}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="survey-filter-target-type">Target type</Label>
              <SelectField
                id="survey-filter-target-type"
                value={draft.targetType}
                placeholder="All target types"
                options={TARGET_TYPES.map((item) => ({ value: item.value, label: item.label }))}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, targetType: value }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="survey-filter-activity">Activity</Label>
              <SelectField
                id="survey-filter-activity"
                value={draft.activity}
                placeholder="All activity states"
                options={ACTIVITY_OPTIONS}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, activity: value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="min-h-11" onClick={clearAndApply}>
            Clear filters
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onApply(draft)}
          >
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
