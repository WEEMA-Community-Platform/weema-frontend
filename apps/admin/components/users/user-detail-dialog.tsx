"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserDetailQuery } from "@/hooks/use-users-admin";
import { useRoleLabel } from "@/components/users/constants";

type UserDetailDialogProps = {
  id: string | null;
  open: boolean;
  onClose: () => void;
};

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-3 gap-y-1 sm:gap-x-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export function UserDetailDialog({ id, open, onClose }: UserDetailDialogProps) {
  const { data, isPending, isError, error, refetch } = useUserDetailQuery(id, { enabled: open && !!id });
  const u = data?.user;
  const t = useTranslations("users.detail");
  const tFields = useTranslations("users.detail.fields");
  const tStates = useTranslations("common.states");
  const roleLabel = useRoleLabel();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>
            {u ? `${u.firstName} ${u.lastName}` : t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-5">
          {isPending && !u ? (
            <div className="space-y-3" aria-busy>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full max-w-md" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : t("loadError")}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                {t("retry")}
              </button>
            </div>
          ) : u ? (
            <dl className="grid gap-3">
              <Field label={tFields("email")} value={u.email} />
              <Field label={tFields("role")} value={<span className="capitalize">{roleLabel(u.role)}</span>} />
              <Field label={tFields("phone")} value={u.phoneNumber ?? "—"} />
              <Field
                label={tFields("status")}
                value={u.active ? tStates("active") : tStates("inactive")}
              />
              <Field
                label={tFields("firstLogin")}
                value={u.firstTimeLogin ? t("yes") : t("no")}
              />
            </dl>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
