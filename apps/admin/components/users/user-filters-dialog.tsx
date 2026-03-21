"use client";

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

export type UserFilterState = {
  filterRole: string;
  setFilterRole: (v: string) => void;
  filterActive: string;
  setFilterActive: (v: string) => void;
};

type UserFiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: UserFilterState;
  onPageReset: () => void;
};

export function UserFiltersDialog({
  open,
  onOpenChange,
  filters,
  onPageReset,
}: UserFiltersDialogProps) {
  const { filterRole, setFilterRole, filterActive, setFilterActive } = filters;

  const clearAll = () => {
    setFilterRole("");
    setFilterActive("");
    onPageReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Filter users</DialogTitle>
          <DialogDescription>
            Narrow the list by role or activation status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 pb-2">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-filter-role">Role</Label>
              <SelectField
                id="user-filter-role"
                value={filterRole}
                placeholder="All roles"
                options={USER_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onValueChange={(v) => {
                  setFilterRole(v);
                  onPageReset();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-filter-active">Activation</Label>
              <SelectField
                id="user-filter-active"
                value={filterActive}
                placeholder="Any status"
                options={[
                  { value: "true", label: "Active only" },
                  { value: "false", label: "Inactive only" },
                ]}
                onValueChange={(v) => {
                  setFilterActive(v);
                  onPageReset();
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="min-h-11" onClick={clearAll}>
            Clear filters
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
