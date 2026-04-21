"use client";

import { useTranslations } from "next-intl";
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
  const tDelete = useTranslations("community.members.delete");
  const tActions = useTranslations("common.actions");
  const tValidation = useTranslations("common.validation");

  const handleDelete = async () => {
    if (!member) return;
    try {
      const result = await deleteMutation.mutateAsync(member.id);
      sileo.success({
        title: tDelete("toasts.deletedTitle"),
        description: result.message,
      });
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: tDelete("toasts.errorTitle"),
        description:
          error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    }
  };

  const memberName = member ? `${member.firstName} ${member.lastName}` : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tDelete("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tDelete.rich("confirm", {
              name: memberName,
              strong: (chunks) => (
                <span className="font-semibold text-foreground">{chunks}</span>
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tActions("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
            {tDelete("action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
