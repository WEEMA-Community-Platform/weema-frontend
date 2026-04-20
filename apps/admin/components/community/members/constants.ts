import type { EntityStatus } from "@/lib/api/community";

export const GENDER_OPTIONS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
] as const;

export const MARITAL_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
] as const;

export const STATUS_OPTIONS: { value: EntityStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export const LOCKED_OPTIONS = [
  { value: "true", label: "Locked" },
  { value: "false", label: "Unlocked" },
] as const;

export const MIN_MEMBER_AGE_YEARS = 15;

export function getMaxDobDate(minAgeYears: number = MIN_MEMBER_AGE_YEARS): string {
  const now = new Date();
  const maxDate = new Date(
    now.getFullYear() - minAgeYears,
    now.getMonth(),
    now.getDate()
  );
  return maxDate.toISOString().split("T")[0] ?? "";
}

export function isAtLeastAge(dateOfBirth: string, minAgeYears: number = MIN_MEMBER_AGE_YEARS): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const maxDate = new Date(getMaxDobDate(minAgeYears));
  return dob.getTime() <= maxDate.getTime();
}
