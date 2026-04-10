"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { sileo } from "sileo";

import { useCloneSurveyMutation } from "@/hooks/use-surveys";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formTextareaClass, inputClass } from "@/components/base-data/shared";

type SurveyCloneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string | null;
  originalTitle: string;
  originalDescription: string;
};

export function SurveyCloneDialog({
  open,
  onOpenChange,
  surveyId,
  originalTitle,
  originalDescription,
}: SurveyCloneDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const cloneMutation = useCloneSurveyMutation();

  useEffect(() => {
    if (open) {
      setTitle(`Copy of ${originalTitle}`);
      setDescription(originalDescription);
    }
  }, [open, originalTitle, originalDescription]);

  const handleClose = () => {
    if (cloneMutation.isPending) return;
    onOpenChange(false);
  };

  const handleClone = async () => {
    if (!surveyId || !title.trim()) return;
    try {
      const result = await cloneMutation.mutateAsync({
        id: surveyId,
        payload: { title: title.trim(), description: description.trim() },
      });
      sileo.success({
        title: "Survey cloned",
        description: result.message ?? "A draft copy of the survey has been created.",
      });
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: "Failed to clone survey",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-6 pb-2 pt-6">
          <DialogTitle>Clone survey</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{originalTitle}</span>
            <span className="mt-1 block">
              Creates a full draft copy — all sections, questions, options, and conditions.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="clone-title">Title</Label>
            <Input
              id="clone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter clone title"
              className={inputClass}
              disabled={cloneMutation.isPending}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clone-description">Description</Label>
            <textarea
              id="clone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this clone's purpose (optional)"
              className={formTextareaClass}
              disabled={cloneMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={cloneMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleClone()}
            disabled={cloneMutation.isPending || !title.trim()}
          >
            {cloneMutation.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Cloning…
              </>
            ) : (
              "Clone survey"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
