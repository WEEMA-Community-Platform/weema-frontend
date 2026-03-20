"use client";

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
  MARITAL_OPTIONS,
  STATUS_OPTIONS,
} from "@/components/community/members/constants";

export type MemberFilterState = {
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterGender: string;
  setFilterGender: (v: string) => void;
  filterMarital: string;
  setFilterMarital: (v: string) => void;
  filterShgId: string;
  setFilterShgId: (v: string) => void;
  filterReligionId: string;
  setFilterReligionId: (v: string) => void;
  filterDobFrom: string;
  setFilterDobFrom: (v: string) => void;
  filterDobTo: string;
  setFilterDobTo: (v: string) => void;
  filterAgeFrom: string;
  setFilterAgeFrom: (v: string) => void;
  filterAgeTo: string;
  setFilterAgeTo: (v: string) => void;
};

type MemberFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MemberFilterState;
  shgOptions: { value: string; label: string }[];
  religionOptions: { value: string; label: string }[];
  onPageReset: () => void;
};

export function MemberFiltersDialog({
  open,
  onOpenChange,
  filters,
  shgOptions,
  religionOptions,
  onPageReset,
}: MemberFiltersDialogProps) {
  const {
    filterStatus,
    setFilterStatus,
    filterGender,
    setFilterGender,
    filterMarital,
    setFilterMarital,
    filterShgId,
    setFilterShgId,
    filterReligionId,
    setFilterReligionId,
    filterDobFrom,
    setFilterDobFrom,
    filterDobTo,
    setFilterDobTo,
    filterAgeFrom,
    setFilterAgeFrom,
    filterAgeTo,
    setFilterAgeTo,
  } = filters;

  const bump = () => {
    onPageReset();
  };

  const clearAll = () => {
    setFilterStatus("");
    setFilterGender("");
    setFilterMarital("");
    setFilterShgId("");
    setFilterReligionId("");
    setFilterDobFrom("");
    setFilterDobTo("");
    setFilterAgeFrom("");
    setFilterAgeTo("");
    onPageReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Filter members</DialogTitle>
          <DialogDescription>
            Narrow the list by status, demographics, self-help group, religion, or age range.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-status">Status</Label>
              <SelectField
                id="member-filter-status"
                value={filterStatus}
                placeholder="All statuses"
                options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onValueChange={(v) => {
                  setFilterStatus(v);
                  bump();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-gender">Gender</Label>
              <SelectField
                id="member-filter-gender"
                value={filterGender}
                placeholder="All genders"
                options={[...GENDER_OPTIONS]}
                onValueChange={(v) => {
                  setFilterGender(v);
                  bump();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-marital">Marital status</Label>
              <SelectField
                id="member-filter-marital"
                value={filterMarital}
                placeholder="All marital statuses"
                options={[...MARITAL_OPTIONS]}
                onValueChange={(v) => {
                  setFilterMarital(v);
                  bump();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-shg">Self-help group</Label>
              <SelectField
                id="member-filter-shg"
                value={filterShgId}
                placeholder="All self-help groups"
                options={shgOptions}
                onValueChange={(v) => {
                  setFilterShgId(v);
                  bump();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-filter-religion">Religion</Label>
              <SelectField
                id="member-filter-religion"
                value={filterReligionId}
                placeholder="All religions"
                options={religionOptions}
                onValueChange={(v) => {
                  setFilterReligionId(v);
                  bump();
                }}
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
                  value={filterDobFrom}
                  onChange={(e) => {
                    setFilterDobFrom(e.target.value);
                    bump();
                  }}
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
                  value={filterDobTo}
                  onChange={(e) => {
                    setFilterDobTo(e.target.value);
                    bump();
                  }}
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
                  value={filterAgeFrom}
                  onChange={(e) => {
                    setFilterAgeFrom(e.target.value);
                    bump();
                  }}
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
                  value={filterAgeTo}
                  onChange={(e) => {
                    setFilterAgeTo(e.target.value);
                    bump();
                  }}
                />
              </div>
            </div>
          </fieldset>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="min-h-11" onClick={clearAll}>
            Clear filters
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
