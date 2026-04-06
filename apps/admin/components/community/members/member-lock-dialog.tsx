"use client";

import { useRef } from "react";
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
  // Keep last non-null values so content doesn't flash during the exit animation.
  const lastMember = useRef(member);
  const lastAction = useRef(action);
  if (member) { lastMember.current = member; lastAction.current = action; }
  const m = lastMember.current;
  const isLocking = lastAction.current === "lock";

  const handleConfirm = async () => {
    if (!m) return;
    try {
      if (isLocking) {
        const result = await lockMutation.mutateAsync(m.id);
        sileo.success({ title: "Member locked", description: result.message });
      } else {
        const result = await unlockMutation.mutateAsync(m.id);
        sileo.success({ title: "Member unlocked", description: result.message });
      }
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: isLocking ? "Could not lock member" : "Could not unlock member",
        description: error instanceof Error ? error.message : "Unexpected error",
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
            {isLocking ? "Lock member" : "Unlock member"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLocking ? (
              <>
                Lock{" "}
                <span className="font-semibold text-foreground">
                  {m?.firstName} {m?.lastName}
                </span>
                ? Facilitators will not be able to edit or delete this member until they are unlocked.
              </>
            ) : (
              <>
                Unlock{" "}
                <span className="font-semibold text-foreground">
                  {m?.firstName} {m?.lastName}
                </span>
                ? Facilitators will be able to edit or delete this member again.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
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
              isLocking ? "Locking..." : "Unlocking..."
            ) : (
              <>
                {isLocking ? <LockIcon className="size-4" /> : <UnlockIcon className="size-4" />}
                {isLocking ? "Lock member" : "Unlock member"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
