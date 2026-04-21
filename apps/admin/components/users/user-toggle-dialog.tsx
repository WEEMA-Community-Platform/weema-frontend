"use client";

import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import type { UserListItem } from "@/lib/api/users-admin";
import type { BaseApiResponse } from "@/lib/api/base-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UseMutationResult } from "@tanstack/react-query";

type ToggleMutation = UseMutationResult<BaseApiResponse, Error, string, unknown>;

type UserToggleDialogProps = {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggleMutation: ToggleMutation;
};

export function UserToggleDialog({
  user,
  open,
  onOpenChange,
  toggleMutation,
}: UserToggleDialogProps) {
  const active = user?.active ?? true;
  const name = user ? `${user.firstName} ${user.lastName}` : "";
  const t = useTranslations("users.toggle");
  const tToasts = useTranslations("users.toggle.toasts");
  const tCommon = useTranslations("common.validation");

  const handleConfirm = async () => {
    if (!user) return;
    try {
      const result = await toggleMutation.mutateAsync(user.id);
      sileo.success({
        title: active ? tToasts("deactivatedTitle") : tToasts("activatedTitle"),
        description: result.message || tToasts("updatedMessage"),
      });
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: tToasts("errorTitle"),
        description: error instanceof Error ? error.message : tCommon("unexpectedError"),
      });
    }
  };

  const highlight = (chunks: React.ReactNode) => (
    <span className="font-semibold text-foreground">{chunks}</span>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {active ? t("deactivateTitle") : t("activateTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {active
              ? t.rich("deactivateConfirm", { name, highlight })
              : t.rich("activateConfirm", { name, highlight })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={toggleMutation.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={active ? "destructive" : "default"}
            disabled={toggleMutation.isPending}
            onClick={() => void handleConfirm()}
          >
            {toggleMutation.isPending
              ? t("updating")
              : active
                ? t("deactivate")
                : t("activate")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
