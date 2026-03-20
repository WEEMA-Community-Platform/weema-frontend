"use client";

import { sileo } from "sileo";

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

type MemberDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  deleteMutation: UseMutationResult<BaseApiResponse, Error, string, unknown>;
};

export function MemberDeleteDialog({
  open,
  onOpenChange,
  member,
  deleteMutation,
}: MemberDeleteDialogProps) {
  const handleDelete = async () => {
    if (!member) return;
    try {
      const result = await deleteMutation.mutateAsync(member.id);
      sileo.success({ title: "Member deleted", description: result.message });
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: "Could not delete member",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete member</AlertDialogTitle>
          <AlertDialogDescription>
            Delete{" "}
            <span className="font-semibold text-foreground">
              {member?.firstName} {member?.lastName}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
            Delete member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
