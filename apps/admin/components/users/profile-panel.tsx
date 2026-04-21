"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import { useCurrentUser } from "@/hooks/use-user";
import { useChangePasswordMutation } from "@/hooks/use-change-password";
import { useEditProfileMutation } from "@/hooks/use-edit-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { inputClass } from "@/components/base-data/shared";
import { SUPER_ADMIN_ROLE, useRoleLabel } from "@/components/users/constants";

function initials(firstName: string, lastName: string) {
  const a = firstName.trim()[0] ?? "";
  const b = lastName.trim()[0] ?? "";
  const s = (a + b).toUpperCase();
  return s || "?";
}

export function ProfilePanel() {
  const { data, isLoading } = useCurrentUser();
  const user = data?.user;
  const mutation = useEditProfileMutation();
  const passwordMutation = useChangePasswordMutation();
  const t = useTranslations("account.profile");
  const tToasts = useTranslations("account.profile.toasts");
  const tCommon = useTranslations("common.validation");
  const roleLabel = useRoleLabel();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [syncedUser, setSyncedUser] = useState(user);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Re-hydrate form fields when the current user loads or changes.
  if (user !== syncedUser) {
    setSyncedUser(user);
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }

  const dirty =
    user &&
    (firstName.trim() !== user.firstName.trim() || lastName.trim() !== user.lastName.trim());

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const passwordReady =
    Boolean(oldPassword && newPassword && confirmPassword) && !passwordMismatch;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      sileo.warning({
        title: tToasts("requiredTitle"),
        description: tToasts("requiredMessage"),
      });
      return;
    }
    if (!dirty) return;
    try {
      const result = await mutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      sileo.success({
        title: tToasts("savedTitle"),
        description: result.message || tToasts("savedMessage"),
      });
    } catch (err) {
      sileo.error({
        title: tToasts("saveErrorTitle"),
        description: err instanceof Error ? err.message : tCommon("unexpectedError"),
      });
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      sileo.warning({
        title: tToasts("requiredTitle"),
        description: tToasts("passwordRequiredMessage"),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      sileo.warning({
        title: tToasts("passwordMismatchTitle"),
        description: tToasts("passwordMismatchMessage"),
      });
      return;
    }
    try {
      const result = await passwordMutation.mutateAsync({
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
      sileo.success({
        title: tToasts("passwordUpdatedTitle"),
        description: result.message || tToasts("passwordUpdatedMessage"),
      });
    } catch (err) {
      sileo.error({
        title: tToasts("passwordErrorTitle"),
        description: err instanceof Error ? err.message : tCommon("unexpectedError"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl self-start">
        <Card className="rounded-xl border border-primary/15 bg-card ring-0">
          <CardHeader className="space-y-3 border-b border-border/50">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex gap-4 border-b border-border/50 px-6 py-6">
              <Skeleton className="size-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-3 pt-0.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
            <div className="space-y-4 px-6 py-6">
              <Skeleton className="h-4 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-2xl self-start">
        <Card className="rounded-xl border border-primary/15 bg-card ring-0">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("loadError")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSuperAdmin = user.role === SUPER_ADMIN_ROLE;

  return (
    <div className="w-full max-w-2xl self-start">
      <Card className="rounded-xl border border-primary/15 bg-card ring-0">
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle className="text-lg font-semibold tracking-tight">{t("title")}</CardTitle>
          <CardDescription className="text-[0.95rem] leading-relaxed">
            {isSuperAdmin ? t("descriptionSuperAdmin") : t("descriptionDefault")}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex gap-4 border-b border-border/50 px-6 py-6">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-base font-semibold text-primary"
              aria-hidden
            >
              {initials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="font-normal capitalize">
                  {roleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="border-b border-border/50 px-6 py-6">
            <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-start">
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-foreground">
                  {t("displayNameHeading")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("displayNameHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-first-name">{t("firstName")}</Label>
                <Input
                  id="profile-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-last-name">{t("lastName")}</Label>
                <Input
                  id="profile-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  autoComplete="family-name"
                  required
                />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="submit"
                  disabled={!dirty || mutation.isPending}
                  className="h-11 min-w-38 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    t("saveName")
                  )}
                </Button>
              </div>
            </div>
          </form>

          <Collapsible
            open={passwordOpen}
            onOpenChange={setPasswordOpen}
            className="group/collapsible"
          >
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/20 text-muted-foreground">
                <Lock className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {t("passwordHeading")}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {t("passwordHint")}
                </span>
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-safe:ease-out group-data-open/collapsible:rotate-180"
                aria-hidden
              />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <form
                onSubmit={submitPassword}
                className="border-t border-border/50 px-6 pb-6 pt-4"
              >
                <div className="w-full space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-old-password">{t("currentPassword")}</Label>
                    <Input
                      id="profile-old-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className={inputClass}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-new-password">{t("newPassword")}</Label>
                    <Input
                      id="profile-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-confirm-password">{t("confirmPassword")}</Label>
                    <Input
                      id="profile-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                      aria-invalid={passwordMismatch}
                    />
                    {passwordMismatch && (
                      <p className="text-xs text-destructive" role="status">
                        {t("passwordsMustMatch")}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={!passwordReady || passwordMutation.isPending}
                      className="h-11 min-w-40 border-primary/25 bg-background hover:bg-muted/60"
                    >
                      {passwordMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t("updatingPassword")}
                        </>
                      ) : (
                        t("updatePassword")
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
