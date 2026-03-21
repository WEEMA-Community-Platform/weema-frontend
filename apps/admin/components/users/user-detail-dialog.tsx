"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserDetailQuery } from "@/hooks/use-users-admin";
import { formatRoleLabel } from "@/components/users/constants";

type UserDetailDialogProps = {
  id: string | null;
  open: boolean;
  onClose: () => void;
};

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-3 gap-y-1 sm:gap-x-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export function UserDetailDialog({ id, open, onClose }: UserDetailDialogProps) {
  const { data, isPending } = useUserDetailQuery(id, { enabled: open && !!id });
  const u = data?.user;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>
            {u ? `${u.firstName} ${u.lastName}` : "User details"}
          </DialogTitle>
          <DialogDescription>Account information (read-only).</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-5">
          {isPending && !u ? (
            <div className="space-y-3" aria-busy>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full max-w-md" />
              ))}
            </div>
          ) : u ? (
            <dl className="grid gap-3">
              <Field label="Email" value={u.email} />
              <Field label="Role" value={<span className="capitalize">{formatRoleLabel(u.role)}</span>} />
              <Field label="Phone" value={u.phoneNumber ?? "—"} />
              <Field
                label="Status"
                value={u.active ? "Active" : "Inactive"}
              />
              <Field
                label="First login"
                value={u.firstTimeLogin ? "Yes" : "No"}
              />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load this user.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
