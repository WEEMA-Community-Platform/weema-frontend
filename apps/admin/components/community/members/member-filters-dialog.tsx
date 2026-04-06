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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/base-data/select-field";
import { inputClass } from "@/components/base-data/shared";
import {
  GENDER_OPTIONS,
  LOCKED_OPTIONS,
  MARITAL_OPTIONS,
  STATUS_OPTIONS,
} from "@/components/community/members/constants";

export type MemberAppliedFilters = {
  status: string;
  isLocked: string;
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
  isLocked: "",
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
  /** Currently applied filters (synced into the dialog when it opens). */
  applied: MemberAppliedFilters;
  /** Called when the user clicks Apply filters. */
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Filter members</DialogTitle>
          <DialogDescription>
            Narrow the list by status, demographics, self-help group, religion, or age range. Changes apply when you click
            Apply filters.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-status">Status</Label>
              <SelectField
                id="member-filter-status"
                value={draft.status}
                placeholder="All statuses"
                options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-locked">Lock status</Label>
              <SelectField
                id="member-filter-locked"
                value={draft.isLocked}
                placeholder="All lock statuses"
                options={LOCKED_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onValueChange={(v) => setDraft((d) => ({ ...d, isLocked: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-gender">Gender</Label>
              <SelectField
                id="member-filter-gender"
                value={draft.gender}
                placeholder="All genders"
                options={[...GENDER_OPTIONS]}
                onValueChange={(v) => setDraft((d) => ({ ...d, gender: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-marital">Marital status</Label>
              <SelectField
                id="member-filter-marital"
                value={draft.marital}
                placeholder="All marital statuses"
                options={[...MARITAL_OPTIONS]}
                onValueChange={(v) => setDraft((d) => ({ ...d, marital: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-shg">Self-help group</Label>
              <SelectField
                id="member-filter-shg"
                value={draft.shgId}
                placeholder="All self-help groups"
                options={shgOptions}
                onValueChange={(v) => setDraft((d) => ({ ...d, shgId: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-religion">Religion</Label>
              <SelectField
                id="member-filter-religion"
                value={draft.religionId}
                placeholder="All religions"
                options={religionOptions}
                onValueChange={(v) => setDraft((d) => ({ ...d, religionId: v }))}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">Date of birth</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="member-filter-dob-from" className="text-xs text-muted-foreground">
                  From
                </label>
                <Input
                  id="member-filter-dob-from"
                  type="date"
                  className={inputClass}
                  value={draft.dobFrom}
                  onChange={(e) => setDraft((d) => ({ ...d, dobFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="member-filter-dob-to" className="text-xs text-muted-foreground">
                  To
                </label>
                <Input
                  id="member-filter-dob-to"
                  type="date"
                  className={inputClass}
                  value={draft.dobTo}
                  onChange={(e) => setDraft((d) => ({ ...d, dobTo: e.target.value }))}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-muted-foreground">Age</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="member-filter-age-from" className="text-xs text-muted-foreground">
                  From
                </label>
                <Input
                  id="member-filter-age-from"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.ageFrom}
                  onChange={(e) => setDraft((d) => ({ ...d, ageFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="member-filter-age-to" className="text-xs text-muted-foreground">
                  To
                </label>
                <Input
                  id="member-filter-age-to"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.ageTo}
                  onChange={(e) => setDraft((d) => ({ ...d, ageTo: e.target.value }))}
                />
              </div>
            </div>
          </fieldset>
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
