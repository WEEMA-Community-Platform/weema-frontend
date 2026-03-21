"use client";

import { FormEvent, useEffect, useState } from "react";
import { sileo } from "sileo";

import { useCurrentUser } from "@/hooks/use-user";
import { useEditProfileMutation } from "@/hooks/use-edit-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveButton, inputClass } from "@/components/base-data/shared";
import { formatRoleLabel } from "@/components/users/constants";

export function ProfilePanel() {
  const { data, isLoading } = useCurrentUser();
  const user = data?.user;
  const mutation = useEditProfileMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  const dirty =
    user &&
    (firstName.trim() !== user.firstName.trim() || lastName.trim() !== user.lastName.trim());

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

  if (isLoading) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>My profile</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>My profile</CardTitle>
          <CardDescription>Could not load your profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <CardTitle>My profile</CardTitle>
        <CardDescription>
          Update your name. Email and role are managed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="max-w-xl space-y-6">
          <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/10 p-4 text-sm">
            <div className="grid gap-1">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{formatRoleLabel(user.role)}</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <div className="flex justify-end">
            <SaveButton
              isPending={mutation.isPending}
              idleLabel="Save changes"
              pendingLabel="Saving…"
              disabled={!dirty}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
