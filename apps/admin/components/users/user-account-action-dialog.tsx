"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/base-data/select-field";
import { useUserRoleOptions, SUPER_ADMIN_ROLE } from "@/components/users/constants";
import { changeUserRole, resetUserPassword, type UserListItem } from "@/lib/api/users-admin";

export function UserAccountActionDialog({ user, kind, onClose }: { user: UserListItem; kind: "role" | "password"; onClose: () => void }) {
  const t = useTranslations("users.accountActions");
  const queryClient = useQueryClient();
  const options = useUserRoleOptions().filter((option) => option.value !== SUPER_ADMIN_ROLE);
  const [role, setRole] = useState(user.role);
  const [result, setResult] = useState<{ message: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyPassword = async () => {
    if (!result?.password) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  const mutation = useMutation({
    gcTime: 0,
    mutationFn: async () => {
      if (user.role === SUPER_ADMIN_ROLE) throw new Error(t("protectedAccount"));
      if (kind === "role") {
        if (!options.some((option) => option.value === role)) throw new Error(t("selectRole"));
        const response = await changeUserRole(user.id, role);
        return { message: response.message || t("roleSuccess") };
      }
      const response = await resetUserPassword(user.id);
      return { message: response.message || t("passwordSuccess"), password: response.temporaryPassword ?? response.newPassword ?? response.password };
    },
    onSuccess: (response) => {
      setResult(response);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
  const submit = (event: FormEvent) => { event.preventDefault(); if (!mutation.isPending && !result) mutation.mutate(); };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>{t(kind === "role" ? "roleTitle" : "passwordTitle")}</DialogTitle>
          <DialogDescription>{user.firstName} {user.lastName} · {user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-4 px-6 py-5">
            {result ? <div role="status" className="space-y-3">
              <p className="whitespace-pre-wrap break-words text-sm">{result.message}</p>
              {result.password ? <div className="space-y-2">
                <Label htmlFor="temporary-password">{t("temporaryPassword")}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input id="temporary-password" readOnly value={result.password} autoComplete="off" onFocus={(event) => event.currentTarget.select()} className="h-11 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <Button type="button" variant="outline" className="h-11" onClick={() => void copyPassword()}>
                    {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                    {t(copied ? "copied" : "copy")}
                  </Button>
                </div>
                {copyError ? <p role="alert" className="text-sm text-destructive">{t("copyError")}</p> : null}
                <p role="status" className="sr-only">{copied ? t("copied") : ""}</p>
              </div> : null}
              {kind === "password" ? <p className="text-sm text-muted-foreground">{t("passwordVisibility")}</p> : null}
            </div> : kind === "role" ? <div className="space-y-2">
              <Label htmlFor="change-user-role">{t("roleLabel")}</Label>
              <SelectField id="change-user-role" value={role} onValueChange={setRole} options={options} placeholder={t("selectRole")} disabled={mutation.isPending} />
              <p className="text-sm text-muted-foreground">{t("roleDescription")}</p>
            </div> : <p className="text-sm text-muted-foreground">{t("passwordDescription")}</p>}
            {mutation.isError ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
          </div>
          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>{t(result ? "done" : "cancel")}</Button>
            {!result ? <Button type="submit" disabled={mutation.isPending || (kind === "role" && (role === user.role || !options.some((option) => option.value === role)))}>{t(mutation.isPending ? "updating" : kind === "role" ? "saveRole" : "resetPassword")}</Button> : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
