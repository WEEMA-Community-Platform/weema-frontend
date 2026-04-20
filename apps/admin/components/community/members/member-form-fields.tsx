"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/base-data/select-field";
import { inputClass } from "@/components/base-data/shared";
import {
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  MIN_MEMBER_AGE_YEARS,
  STATUS_OPTIONS,
  getMaxDobDate,
} from "@/components/community/members/constants";

function RequiredStar() {
  return (
    <span className="ml-0.5 text-base leading-none text-destructive" aria-hidden="true">
      *
    </span>
  );
}

export type MemberFormFieldsProps = {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  dateJoinedShg: string;
  setDateJoinedShg: (v: string) => void;
  fan: string;
  setFan: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  maritalStatus: string;
  setMaritalStatus: (v: string) => void;
  religionId?: string;
  setReligionId?: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  selfHelpGroupId: string;
  setSelfHelpGroupId: (v: string) => void;
  religionOptions?: { value: string; label: string }[];
  shgOptions: { value: string; label: string }[];
  showReligionField?: boolean;
  nationalIdSection?: ReactNode;
};

export function MemberFormFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  contactPhone,
  setContactPhone,
  dateOfBirth,
  setDateOfBirth,
  dateJoinedShg,
  setDateJoinedShg,
  fan,
  setFan,
  gender,
  setGender,
  maritalStatus,
  setMaritalStatus,
  religionId,
  setReligionId,
  status,
  setStatus,
  selfHelpGroupId,
  setSelfHelpGroupId,
  religionOptions,
  shgOptions,
  showReligionField = true,
  nationalIdSection,
}: MemberFormFieldsProps) {
  const maxDobDate = getMaxDobDate();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="member-first-name">
                First name
                <RequiredStar />
              </Label>
              <Input
                id="member-first-name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-last-name">
                Last name
                <RequiredStar />
              </Label>
              <Input
                id="member-last-name"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-phone">Contact phone</Label>
            <Input
              id="member-phone"
              placeholder="Contact phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className={inputClass}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-dob">
              Date of birth
              <RequiredStar />
            </Label>
            <Input
              id="member-dob"
              type="date"
              className={inputClass}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={maxDobDate}
              required
            />
            <p className="text-xs text-muted-foreground">
              Member must be at least {MIN_MEMBER_AGE_YEARS} years old.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-fan">FAN</Label>
            <Input
              id="member-fan"
              placeholder="FAN"
              value={fan}
              onChange={(e) => setFan(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-date-joined-shg">Date joined SHG</Label>
            <Input
              id="member-date-joined-shg"
              type="date"
              className={inputClass}
              value={dateJoinedShg}
              onChange={(e) => setDateJoinedShg(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Classifications
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="member-gender">
              Gender
              <RequiredStar />
            </Label>
            <SelectField
              id="member-gender"
              value={gender}
              placeholder="Gender"
              options={[...GENDER_OPTIONS]}
              onValueChange={setGender}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-marital">
              Marital status
              <RequiredStar />
            </Label>
            <SelectField
              id="member-marital"
              value={maritalStatus}
              placeholder="Marital status"
              options={[...MARITAL_OPTIONS]}
              onValueChange={setMaritalStatus}
            />
          </div>
          {showReligionField ? (
            <div className="space-y-1.5">
              <Label htmlFor="member-religion">Religion</Label>
              <SelectField
                id="member-religion"
                value={religionId ?? ""}
                placeholder="Religion"
                options={religionOptions ?? []}
                onValueChange={setReligionId ?? (() => {})}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="member-status">
              Status
              <RequiredStar />
            </Label>
            <SelectField
              id="member-status"
              value={status}
              placeholder="Status"
              options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              onValueChange={setStatus}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-shg">
              Self-help group
              <RequiredStar />
            </Label>
            <SelectField
              id="member-shg"
              value={selfHelpGroupId}
              placeholder="Self-help group"
              options={shgOptions}
              onValueChange={setSelfHelpGroupId}
            />
          </div>
        </div>
      </div>
      {nationalIdSection}
    </>
  );
}
