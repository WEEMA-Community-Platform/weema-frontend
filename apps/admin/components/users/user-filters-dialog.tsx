"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/base-data/select-field";
import { USER_ROLE_OPTIONS } from "@/components/users/constants";

export type UserAppliedFilters = {
  role: string;
  active: string;
};

type UserFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: UserAppliedFilters;
  onApply: (filters: UserAppliedFilters) => void;
};

export function UserFiltersDialog({ open, onOpenChange, applied, onApply }: UserFiltersDialogProps) {
  const [draft, setDraft] = useState<UserAppliedFilters>(applied);

  useEffect(() => {
    if (open) {
      setDraft(applied);
    }
  }, [open, applied]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Filter users</DialogTitle>
          <DialogDescription>
            Narrow the list by role or activation status. Changes apply when you click Apply filters.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-filter-role">Role</Label>
              <SelectField
                id="user-filter-role"
                value={draft.role}
                placeholder="All roles"
                options={USER_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onValueChange={(v) => setDraft((d) => ({ ...d, role: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-filter-active">Activation</Label>
              <SelectField
                id="user-filter-active"
                value={draft.active}
                placeholder="Any status"
                options={[
                  { value: "true", label: "Active only" },
                  { value: "false", label: "Inactive only" },
                ]}
                onValueChange={(v) => setDraft((d) => ({ ...d, active: v }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              setDraft({ role: "", active: "" });
              onApply({ role: "", active: "" });
            }}
          >
            Clear filters
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onApply(draft)}
          >
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
