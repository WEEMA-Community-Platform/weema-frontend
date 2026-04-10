"use client";

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

import type { PendingDelete, PendingReorder } from "./shared";

type BuilderDialogsProps = {
  pendingDelete: PendingDelete | null;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  pendingReorder: PendingReorder | null;
  isSavingReorder: boolean;
  onReorderOpenChange: (open: boolean) => void;
  onReorderConfirm: () => void;
};

export function BuilderDialogs({
  pendingDelete,
  onDeleteOpenChange,
  onDeleteConfirm,
  pendingReorder,
  isSavingReorder,
  onReorderOpenChange,
  onReorderConfirm,
}: BuilderDialogsProps) {
  return (
    <>
      <AlertDialog open={!!pendingDelete} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "section" ? "Delete section" : "Delete question"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "section" ? (
                <>
                  Delete{" "}
                  <span className="font-semibold text-foreground">{pendingDelete.title}</span>?
                  Questions in this section will also be removed.
                </>
              ) : (
                <>
                  Delete{" "}
                  <span className="font-semibold text-foreground">
                    {pendingDelete?.questionText}
                  </span>
                  ? This question and its follow-up logic will be removed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDeleteConfirm}>
              {pendingDelete?.kind === "section" ? "Delete section" : "Delete question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingReorder}
        onOpenChange={(open) => { if (!open && !isSavingReorder) onReorderOpenChange(false); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingReorder?.kind === "section" ? "Save section order" : "Save question order"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingReorder?.kind === "section"
                ? "Apply this new section order now?"
                : "Apply this new question order now?"}
              {isSavingReorder ? " Saving..." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingReorder}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isSavingReorder} onClick={onReorderConfirm}>
              {isSavingReorder ? "Saving order..." : "Save order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
