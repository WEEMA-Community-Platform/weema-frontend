"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";
import { LockIcon, UnlockIcon } from "lucide-react";

import type { Member } from "@/lib/api/members";
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
import type { BaseApiResponse } from "@/lib/api/base-data";

type MemberLockDialogProps = {
  member: Member | null;
  action: "lock" | "unlock";
  onOpenChange: (open: boolean) => void;
  lockMutation: UseMutationResult<BaseApiResponse, Error, string, unknown>;
  unlockMutation: UseMutationResult<BaseApiResponse, Error, string, unknown>;
};

export function MemberLockDialog({
  member,
  action,
  onOpenChange,
  lockMutation,
  unlockMutation,
}: MemberLockDialogProps) {
  const tLock = useTranslations("community.members.lock");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");

  // Keep last non-null values so content doesn't flash during the exit
  // animation. We use state (not a ref) so React 19's rules-of-refs are
  // satisfied; the "adjust state during render" pattern is cheap because
  // the update only runs when `member` transitions to a new non-null value.
  const [latched, setLatched] = useState<{ member: Member; action: "lock" | "unlock" } | null>(
    member ? { member, action } : null
  );
  if (member && (latched?.member !== member || latched?.action !== action)) {
    setLatched({ member, action });
  }
  const m = latched?.member ?? null;
  const isLocking = (latched?.action ?? action) === "lock";
  const memberName = m ? `${m.firstName} ${m.lastName}` : "";

  const handleConfirm = async () => {
    if (!m) return;
    try {
      if (isLocking) {
        const result = await lockMutation.mutateAsync(m.id);
        sileo.success({
          title: tLock("toasts.lockedTitle"),
          description: result.message,
        });
      } else {
        const result = await unlockMutation.mutateAsync(m.id);
        sileo.success({
          title: tLock("toasts.unlockedTitle"),
          description: result.message,
        });
      }
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: isLocking
          ? tLock("toasts.lockErrorTitle")
          : tLock("toasts.unlockErrorTitle"),
        description:
          error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    }
  };

  const isPending = lockMutation.isPending || unlockMutation.isPending;

  return (
    <AlertDialog open={!!member} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isLocking ? (
              <LockIcon className="size-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <UnlockIcon className="size-4 text-amber-500" />
            )}
            {isLocking ? tLock("lockTitle") : tLock("unlockTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tLock.rich(isLocking ? "lockConfirm" : "unlockConfirm", {
              name: memberName,
              strong: (chunks) => (
                <span className="font-semibold text-foreground">{chunks}</span>
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tActions("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleConfirm()}
            disabled={isPending}
            className={
              isLocking
                ? "bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                : "bg-amber-600 hover:bg-amber-500"
            }
          >
            {isPending ? (
              isLocking ? tLock("locking") : tLock("unlocking")
            ) : (
              <>
                {isLocking ? <LockIcon className="size-4" /> : <UnlockIcon className="size-4" />}
                {isLocking ? tLock("lockAction") : tLock("unlockAction")}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
