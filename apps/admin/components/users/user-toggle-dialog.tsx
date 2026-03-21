"use client";

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

  const handleConfirm = async () => {
    if (!user) return;
    try {
      const result = await toggleMutation.mutateAsync(user.id);
      sileo.success({
        title: active ? "User deactivated" : "User activated",
        description: result.message || "Updated.",
      });
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: "Could not update user",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{active ? "Deactivate user" : "Activate user"}</AlertDialogTitle>
          <AlertDialogDescription>
            {active ? "Deactivate" : "Activate"}{" "}
            <span className="font-semibold text-foreground">{name}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={toggleMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={active ? "destructive" : "default"}
            disabled={toggleMutation.isPending}
            onClick={() => void handleConfirm()}
          >
            {toggleMutation.isPending ? "Updating…" : active ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
