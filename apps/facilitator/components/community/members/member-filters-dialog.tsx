"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/base-data/select-field";
import { inputClass } from "@/components/base-data/shared";
import {
  APPROVAL_STATUS_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  STATUS_OPTIONS,
} from "@/components/community/members/constants";

export type MemberAppliedFilters = {
  status: string;
  approvalStatus: string;
  gender: string;
  marital: string;
  shgId: string;
  religionId: string;
  dobFrom: string;
  dobTo: string;
  ageFrom: string;
  ageTo: string;
};

const emptyFilters: MemberAppliedFilters = {
  status: "",
  approvalStatus: "",
  gender: "",
  marital: "",
  shgId: "",
  religionId: "",
  dobFrom: "",
  dobTo: "",
  ageFrom: "",
  ageTo: "",
};

type MemberFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: MemberAppliedFilters;
  onApply: (filters: MemberAppliedFilters) => void;
  shgOptions: { value: string; label: string }[];
  religionOptions: { value: string; label: string }[];
};

export function MemberFiltersDialog({
  open,
  onOpenChange,
  applied,
  onApply,
  shgOptions,
  religionOptions,
}: MemberFiltersDialogProps) {
  const tFilters = useTranslations("community.members.filters");
  const tStatus = useTranslations("community.members.options.status");
  const tApproval = useTranslations("community.members.options.approval");
  const tGender = useTranslations("community.members.options.gender");
  const tMarital = useTranslations("community.members.options.marital");

  const [draft, setDraft] = useState<MemberAppliedFilters>(applied);

  useEffect(() => {
    if (open) {
      setDraft(applied);
    }
  }, [open, applied]);

  const clearAndApply = () => {
    setDraft({ ...emptyFilters });
    onApply(emptyFilters);
  };

  const statusOptions = STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: tStatus(o.value.toLowerCase() as "active" | "inactive"),
  }));
  const approvalOptions = APPROVAL_STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: tApproval(
      o.value.toLowerCase() as "pending" | "approved" | "rejected"
    ),
  }));
  const genderOptions = GENDER_OPTIONS.map((o) => ({
    value: o.value,
    label: tGender(o.value.toLowerCase() as "male" | "female"),
  }));
  const maritalOptions = MARITAL_OPTIONS.map((o) => ({
    value: o.value,
    label: tMarital(o.value.toLowerCase() as "single" | "married" | "divorced"),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>{tFilters("title")}</DialogTitle>
          <DialogDescription>{tFilters("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-status">{tFilters("status")}</Label>
              <SelectField
                id="member-filter-status"
                value={draft.status}
                placeholder={tFilters("statusAll")}
                options={statusOptions}
                onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-approval-status">
                {tFilters("approval")}
              </Label>
              <SelectField
                id="member-filter-approval-status"
                value={draft.approvalStatus}
                placeholder={tFilters("approvalAll")}
                options={approvalOptions}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, approvalStatus: v }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-gender">{tFilters("gender")}</Label>
              <SelectField
                id="member-filter-gender"
                value={draft.gender}
                placeholder={tFilters("genderAll")}
                options={genderOptions}
                onValueChange={(v) => setDraft((d) => ({ ...d, gender: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-marital">
                {tFilters("marital")}
              </Label>
              <SelectField
                id="member-filter-marital"
                value={draft.marital}
                placeholder={tFilters("maritalAll")}
                options={maritalOptions}
                onValueChange={(v) => setDraft((d) => ({ ...d, marital: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-shg">{tFilters("shg")}</Label>
              <SelectField
                id="member-filter-shg"
                value={draft.shgId}
                placeholder={tFilters("shgAll")}
                options={shgOptions}
                onValueChange={(v) => setDraft((d) => ({ ...d, shgId: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-religion">
                {tFilters("religion")}
              </Label>
              <SelectField
                id="member-filter-religion"
                value={draft.religionId}
                placeholder={tFilters("religionAll")}
                options={religionOptions}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, religionId: v }))
                }
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">
              {tFilters("dobLegend")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="member-filter-dob-from"
                  className="text-xs text-muted-foreground"
                >
                  {tFilters("from")}
                </label>
                <Input
                  id="member-filter-dob-from"
                  type="date"
                  className={inputClass}
                  value={draft.dobFrom}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dobFrom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="member-filter-dob-to"
                  className="text-xs text-muted-foreground"
                >
                  {tFilters("to")}
                </label>
                <Input
                  id="member-filter-dob-to"
                  type="date"
                  className={inputClass}
                  value={draft.dobTo}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dobTo: e.target.value }))
                  }
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">
              {tFilters("ageLegend")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="member-filter-age-from"
                  className="text-xs text-muted-foreground"
                >
                  {tFilters("from")}
                </label>
                <Input
                  id="member-filter-age-from"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.ageFrom}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, ageFrom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="member-filter-age-to"
                  className="text-xs text-muted-foreground"
                >
                  {tFilters("to")}
                </label>
                <Input
                  id="member-filter-age-to"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.ageTo}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, ageTo: e.target.value }))
                  }
                />
              </div>
            </div>
          </fieldset>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={clearAndApply}
          >
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
