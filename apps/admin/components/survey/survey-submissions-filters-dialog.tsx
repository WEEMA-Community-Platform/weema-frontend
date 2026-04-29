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

export type SurveySubmissionsAppliedFilters = {
  shgId: string;
};

const emptyFilters: SurveySubmissionsAppliedFilters = {
  shgId: "",
};

type SurveySubmissionsFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: SurveySubmissionsAppliedFilters;
  onApply: (filters: SurveySubmissionsAppliedFilters) => void;
  shgOptions: { id: string; name: string }[];
};

export function SurveySubmissionsFiltersDialog({
  open,
  onOpenChange,
  applied,
  onApply,
  shgOptions,
}: SurveySubmissionsFiltersDialogProps) {
  const tFilters = useTranslations("survey.submissions.filters");

  const [draft, setDraft] = useState<SurveySubmissionsAppliedFilters>(applied);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(applied);
  }

  const clearAndApply = () => {
    setDraft({ ...emptyFilters });
    onApply(emptyFilters);
  };

  const selectOptions = useMemo(
    () => shgOptions.map((o) => ({ value: o.id, label: o.name })),
    [shgOptions]
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="submission-filter-shg">{tFilters("selfHelpGroup")}</Label>
              <SelectField
                id="submission-filter-shg"
                value={draft.shgId}
                placeholder={tFilters("selfHelpGroupAll")}
                options={selectOptions}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, shgId: value }))}
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
