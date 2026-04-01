"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Loader2, Lock } from "lucide-react";
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
import { formatRoleLabel, SUPER_ADMIN_ROLE } from "@/components/users/constants";

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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

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
      sileo.warning({ title: "Required", description: "First and last name are required." });
      return;
    }
    if (!dirty) return;
    try {
      const result = await mutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      sileo.success({ title: "Profile updated", description: result.message || "Saved." });
    } catch (err) {
      sileo.error({
        title: "Could not update profile",
        description: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      sileo.warning({
        title: "Required",
        description: "Enter your current password and a new password.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      sileo.warning({ title: "Mismatch", description: "New passwords do not match." });
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
        title: "Password updated",
        description: result.message || "Your password was changed.",
      });
    } catch (err) {
      sileo.error({
        title: "Could not change password",
        description: err instanceof Error ? err.message : "Unexpected error",
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
            <CardTitle>Account details</CardTitle>
            <CardDescription>
              We couldn&apos;t load your account. Try refreshing the page or signing in again.
            </CardDescription>
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
          <CardTitle className="text-lg font-semibold tracking-tight">Account details</CardTitle>
          <CardDescription className="text-[0.95rem] leading-relaxed">
            {isSuperAdmin ? (
              <>Manage how your name appears and keep your sign-in secure.</>
            ) : (
              <>
                Manage how your name appears and keep your sign-in secure. Email and role are set by
                an administrator.
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* Identity */}
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
                  {formatRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Name */}
          <form onSubmit={submit} className="border-b border-border/50 px-6 py-6">
            <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-start">
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-foreground">Display name</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shown across the platform and in reports.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-first-name">First name</Label>
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
                <Label htmlFor="profile-last-name">Last name</Label>
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
                      Saving…
                    </>
                  ) : (
                    "Save name"
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Password — progressive disclosure */}
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
                  Password & security
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  Update the password you use to sign in
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
                    <Label htmlFor="profile-old-password">Current password</Label>
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
                    <Label htmlFor="profile-new-password">New password</Label>
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
                    <Label htmlFor="profile-confirm-password">Confirm new password</Label>
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
                        New passwords must match.
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
                          Updating…
                        </>
                      ) : (
                        "Update password"
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
