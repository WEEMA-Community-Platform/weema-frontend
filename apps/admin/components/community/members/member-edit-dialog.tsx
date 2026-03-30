"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";

import type { Member } from "@/lib/api/members";
import type { EntityStatus } from "@/lib/api/community";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/base-data/shared";
import { MemberFormFields } from "@/components/community/members/member-form-fields";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BaseApiResponse } from "@/lib/api/base-data";
import type { RejectMemberPayload } from "@/lib/api/members";

type UpdateMutation = UseMutationResult<
  BaseApiResponse,
  Error,
  { id: string; payload: import("@/lib/api/members").MemberPatchPayload },
  unknown
>;

function snapshotFromMember(m: Member) {
  return {
    firstName: m.firstName.trim(),
    lastName: m.lastName.trim(),
    contactPhone: (m.contactPhone ?? "").trim(),
    gender: m.gender,
    dateOfBirth: m.dateOfBirth ?? "",
    maritalStatus: m.maritalStatus ?? "",
    religionId: m.religionId ?? "",
    status: m.status,
    selfHelpGroupId: m.selfHelpGroupId,
    fan: (m.fan ?? "").trim(),
  };
}

type MemberEditDialogProps = {
  member: Member | null;
  /** Clears edit state (e.g. setEditingMember(null)). */
  onClose: () => void;
  religionOptions: { value: string; label: string }[];
  shgOptions: { value: string; label: string }[];
  updateMutation: UpdateMutation;
  approveMutation: UseMutationResult<BaseApiResponse, Error, string, unknown>;
  rejectMutation: UseMutationResult<
    BaseApiResponse,
    Error,
    { id: string; payload: RejectMemberPayload },
    unknown
  >;
  isSubmitting: boolean;
  /** Clears view-only state so the view dialog cannot reopen when edit closes. */
  onDismiss?: () => void;
};

export function MemberEditDialog({
  member,
  onClose,
  religionOptions,
  shgOptions,
  updateMutation,
  approveMutation,
  rejectMutation,
  isSubmitting,
  onDismiss,
}: MemberEditDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [religionId, setReligionId] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ACTIVE");
  const [selfHelpGroupId, setSelfHelpGroupId] = useState("");
  const [fan, setFan] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [editFormSynced, setEditFormSynced] = useState(false);

  const open = !!member;
  const isApproved = (member?.approvalStatus ?? "").toUpperCase() === "APPROVED";

  const formSnapshot = useMemo(
    () => ({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactPhone: contactPhone.trim(),
      gender,
      dateOfBirth,
      maritalStatus,
      religionId,
      status,
      selfHelpGroupId,
      fan: fan.trim(),
    }),
    [
      firstName,
      lastName,
      contactPhone,
      gender,
      dateOfBirth,
      maritalStatus,
      religionId,
      status,
      selfHelpGroupId,
      fan,
    ]
  );

  const isEditDirty = useMemo(() => {
    if (!member || !editFormSynced) return false;
    return JSON.stringify(snapshotFromMember(member)) !== JSON.stringify(formSnapshot);
  }, [member, editFormSynced, formSnapshot]);

  useEffect(() => {
    if (member) {
      setFirstName(member.firstName);
      setLastName(member.lastName);
      setContactPhone(member.contactPhone ?? "");
      setGender(member.gender);
      setDateOfBirth(member.dateOfBirth ?? "");
      setMaritalStatus(member.maritalStatus ?? "");
      setReligionId(member.religionId ?? "");
      setStatus((member.status as EntityStatus) || "ACTIVE");
      setSelfHelpGroupId(member.selfHelpGroupId);
      setFan(member.fan ?? "");
      setRejectionReason(member.rejectionReason ?? "");
      setEditFormSynced(true);
    } else {
      setEditFormSynced(false);
    }
  }, [member]);

  const dismiss = () => {
    onClose();
    onDismiss?.();
  };

  const dismissAfterExit = () => {
    window.setTimeout(dismiss, 220);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) dismiss();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!member) return;
    if (!firstName.trim() || !lastName.trim() || !gender) {
      sileo.warning({
        title: "Required fields",
        description: "First name, last name, and gender are required.",
      });
      return;
    }
    if (!isEditDirty) return;

    try {
      const result = await updateMutation.mutateAsync({
        id: member.id,
        payload: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactPhone: contactPhone.trim() || undefined,
          gender,
          dateOfBirth: dateOfBirth || null,
          maritalStatus: maritalStatus || null,
          religionId: religionId || null,
          status,
          selfHelpGroupId,
          fan: fan.trim() || null,
        },
      });
      sileo.success({ title: "Member updated", description: result.message });
      dismissAfterExit();
    } catch (error) {
      sileo.error({
        title: "Could not update member",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const handleApprove = async () => {
    if (!member) return;
    try {
      const result = await approveMutation.mutateAsync(member.id);
      sileo.success({
        title: "Member approved",
        description: result.message || "Member is now approved.",
      });
      dismissAfterExit();
    } catch (error) {
      sileo.error({
        title: "Could not approve member",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const handleReject = async () => {
    if (!member) return;
    try {
      const result = await rejectMutation.mutateAsync({
        id: member.id,
        payload: {
          rejectionReason: rejectionReason.trim() || undefined,
        },
      });
      sileo.success({
        title: "Member rejected",
        description: result.message || "Member is now rejected.",
      });
      dismissAfterExit();
    } catch (error) {
      sileo.error({
        title: "Could not reject member",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,42rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>
              Update member details. To change national ID, open View and upload a document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            <MemberFormFields
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              dateOfBirth={dateOfBirth}
              setDateOfBirth={setDateOfBirth}
              fan={fan}
              setFan={setFan}
              gender={gender}
              setGender={setGender}
              maritalStatus={maritalStatus}
              setMaritalStatus={setMaritalStatus}
              religionId={religionId}
              setReligionId={setReligionId}
              status={status}
              setStatus={(v) => setStatus(v as EntityStatus)}
              selfHelpGroupId={selfHelpGroupId}
              setSelfHelpGroupId={setSelfHelpGroupId}
              religionOptions={religionOptions}
              shgOptions={shgOptions}
            />
            {!isApproved ? (
              <div className="space-y-1.5">
                <label htmlFor="member-rejection-reason" className="text-sm font-medium">
                  Rejection reason (optional)
                </label>
                <textarea
                  id="member-rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Provide a reason if this member is rejected"
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 dark:bg-input/30"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
            <div className="flex items-center gap-2">
              {!isApproved ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={approveMutation.isPending || rejectMutation.isPending || isSubmitting}
                  onClick={() => void handleApprove()}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              ) : null}
              {!isApproved ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={approveMutation.isPending || rejectMutation.isPending || isSubmitting}
                  onClick={() => void handleReject()}
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
              ) : null}
            </div>
            <SaveButton
              isPending={isSubmitting}
              idleLabel="Save changes"
              pendingLabel="Saving…"
              disabled={!isEditDirty}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
