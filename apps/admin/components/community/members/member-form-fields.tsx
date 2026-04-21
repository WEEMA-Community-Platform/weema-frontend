"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("community.members");
  const tGender = useTranslations("community.members.options.gender");
  const tMarital = useTranslations("community.members.options.marital");
  const tStatus = useTranslations("community.members.options.status");
  const maxDobDate = getMaxDobDate();

  const genderOptions = GENDER_OPTIONS.map((o) => ({
    value: o.value,
    label: tGender(o.value.toLowerCase() as "male" | "female"),
  }));
  const maritalOptions = MARITAL_OPTIONS.map((o) => ({
    value: o.value,
    label: tMarital(o.value.toLowerCase() as "single" | "married" | "divorced"),
  }));
  const statusOptions = STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: tStatus(o.value.toLowerCase() as "active" | "inactive"),
  }));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("sections.details")}
          </p>
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="member-first-name">
                {t("fields.firstName")}
                <RequiredStar />
              </Label>
              <Input
                id="member-first-name"
                placeholder={t("placeholders.firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-last-name">
                {t("fields.lastName")}
                <RequiredStar />
              </Label>
              <Input
                id="member-last-name"
                placeholder={t("placeholders.lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-phone">{t("fields.contactPhone")}</Label>
            <Input
              id="member-phone"
              placeholder={t("placeholders.contactPhone")}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className={inputClass}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-dob">
              {t("fields.dateOfBirth")}
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
              {t("minAgeHint", { years: MIN_MEMBER_AGE_YEARS })}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-fan">{t("fields.fan")}</Label>
            <Input
              id="member-fan"
              placeholder={t("placeholders.fan")}
              value={fan}
              onChange={(e) => setFan(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-date-joined-shg">{t("fields.dateJoinedShg")}</Label>
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
            {t("sections.classifications")}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="member-gender">
              {t("fields.gender")}
              <RequiredStar />
            </Label>
            <SelectField
              id="member-gender"
              value={gender}
              placeholder={t("placeholders.gender")}
              options={genderOptions}
              onValueChange={setGender}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-marital">
              {t("fields.maritalStatus")}
              <RequiredStar />
            </Label>
            <SelectField
              id="member-marital"
              value={maritalStatus}
              placeholder={t("placeholders.maritalStatus")}
              options={maritalOptions}
              onValueChange={setMaritalStatus}
            />
          </div>
          {showReligionField ? (
            <div className="space-y-1.5">
              <Label htmlFor="member-religion">{t("fields.religion")}</Label>
              <SelectField
                id="member-religion"
                value={religionId ?? ""}
                placeholder={t("placeholders.religion")}
                options={religionOptions ?? []}
                onValueChange={setReligionId ?? (() => {})}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="member-status">
              {t("fields.status")}
              <RequiredStar />
            </Label>
            <SelectField
              id="member-status"
              value={status}
              placeholder={t("placeholders.status")}
              options={statusOptions}
              onValueChange={setStatus}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-shg">
              {t("fields.shg")}
              <RequiredStar />
            </Label>
            <SelectField
              id="member-shg"
              value={selfHelpGroupId}
              placeholder={t("placeholders.shg")}
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
