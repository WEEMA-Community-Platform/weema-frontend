"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

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
import { SaveButton, inputClass } from "@/components/base-data/shared";
import { useUserRoleOptions } from "@/components/users/constants";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BaseApiResponse } from "@/lib/api/base-data";
import type { CreateUserPayload } from "@/lib/api/users-admin";

type CreateMutation = UseMutationResult<BaseApiResponse, Error, CreateUserPayload, unknown>;

type UserCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMutation: CreateMutation;
  setPage: (n: number | ((p: number) => number)) => void;
};

export function UserCreateDialog({
  open,
  onOpenChange,
  createMutation,
  setPage,
}: UserCreateDialogProps) {
  const FACILITATOR_ROLE = "ROLE_FACILITATOR";
  const normalizeLocalPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("251")) digits = digits.slice(3);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 9);
  };
  const isValidEthiopianLocalPhone = (localNumber: string) => /^[97]\d{8}$/.test(localNumber);

  const t = useTranslations("users.create");
  const tToasts = useTranslations("users.create.toasts");
  const tCommon = useTranslations("common.validation");
  const roleOptions = useUserRoleOptions();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setRole("");
  };

  const dismiss = () => {
    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) dismiss();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) {
      sileo.warning({
        title: tToasts("requiredTitle"),
        description: tToasts("requiredMessage"),
      });
      return;
    }
    const localPhoneNumber = normalizeLocalPhone(phoneNumber);
    const isFacilitator = role === FACILITATOR_ROLE;

    if (isFacilitator && !localPhoneNumber) {
      sileo.warning({
        title: tToasts("phoneRequiredTitle"),
        description: tToasts("phoneRequiredMessage"),
      });
      return;
    }
    if (localPhoneNumber && !isValidEthiopianLocalPhone(localPhoneNumber)) {
      sileo.warning({
        title: tToasts("phoneInvalidTitle"),
        description: tToasts("phoneInvalidMessage"),
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
        phoneNumber: localPhoneNumber ? `+251${localPhoneNumber}` : undefined,
      });
      sileo.success({
        title: tToasts("createdTitle"),
        description: result.message || tToasts("createdMessage"),
      });
      setPage(1);
      dismiss();
    } catch (err) {
      sileo.error({
        title: tToasts("errorTitle"),
        description: err instanceof Error ? err.message : tCommon("unexpectedError"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-user-first">{t("firstName")}</Label>
                <Input
                  id="create-user-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-user-last">{t("lastName")}</Label>
                <Input
                  id="create-user-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-user-email">{t("email")}</Label>
              <Input
                id="create-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-user-phone">
                {t("phoneLabel")}{" "}
                {role === FACILITATOR_ROLE ? t("phoneRequiredSuffix") : t("phoneOptionalSuffix")}
              </Label>
              <div className="flex items-stretch">
                <span className="inline-flex h-11 items-center gap-1.5 rounded-l-lg border border-r-0 border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                  <span aria-hidden="true">🇪🇹</span>
                  +251
                </span>
                <Input
                  id="create-user-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={9}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(normalizeLocalPhone(e.target.value))}
                  className={`${inputClass} rounded-l-none`}
                  autoComplete="tel"
                  placeholder={t("phonePlaceholder")}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-user-role">{t("role")}</Label>
              <SelectField
                id="create-user-role"
                value={role}
                placeholder={t("rolePlaceholder")}
                options={roleOptions.map((o) => ({ value: o.value, label: o.label }))}
                onValueChange={setRole}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end border-t border-border/60 px-6 py-4">
            <SaveButton
              isPending={createMutation.isPending}
              idleLabel={t("submit")}
              pendingLabel={t("submitting")}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
