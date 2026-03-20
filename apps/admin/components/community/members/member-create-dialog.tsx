"use client";

import { FormEvent, useState } from "react";
import { sileo } from "sileo";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SaveButton } from "@/components/base-data/shared";
import { MemberFormFields } from "@/components/community/members/member-form-fields";
import { NationalIdDropzone } from "@/components/community/members/national-id-dropzone";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BaseApiResponse } from "@/lib/api/base-data";

type CreateMutation = UseMutationResult<BaseApiResponse, Error, FormData, unknown>;

type MemberCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  religionOptions: { value: string; label: string }[];
  shgOptions: { value: string; label: string }[];
  createMutation: CreateMutation;
  isSubmitting: boolean;
  setPage: (n: number | ((p: number) => number)) => void;
};

function emptyForm() {
  return {
    firstName: "",
    lastName: "",
    contactPhone: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    religionId: "",
    status: "",
    selfHelpGroupId: "",
    fan: "",
    nationalIdFile: null as File | null,
  };
}

export function MemberCreateDialog({
  open,
  onOpenChange,
  religionOptions,
  shgOptions,
  createMutation,
  isSubmitting,
  setPage,
}: MemberCreateDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [religionId, setReligionId] = useState("");
  const [status, setStatus] = useState("");
  const [selfHelpGroupId, setSelfHelpGroupId] = useState("");
  const [fan, setFan] = useState("");
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);

  const reset = () => {
    const e = emptyForm();
    setFirstName(e.firstName);
    setLastName(e.lastName);
    setContactPhone(e.contactPhone);
    setGender(e.gender);
    setDateOfBirth(e.dateOfBirth);
    setMaritalStatus(e.maritalStatus);
    setReligionId(e.religionId);
    setStatus(e.status);
    setSelfHelpGroupId(e.selfHelpGroupId);
    setFan(e.fan);
    setNationalIdFile(e.nationalIdFile);
  };

  const dismiss = () => {
    reset();
    onOpenChange(false);
  };

  const dismissAfterExit = () => {
    window.setTimeout(dismiss, 220);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) dismiss();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      sileo.warning({
        title: "Required fields",
        description: "First name and last name are required.",
      });
      return;
    }
    if (!gender) {
      sileo.warning({
        title: "Gender",
        description: "Select a gender.",
      });
      return;
    }
    if (!status) {
      sileo.warning({
        title: "Status",
        description: "Select a status.",
      });
      return;
    }
    if (!selfHelpGroupId) {
      sileo.warning({
        title: "Self-help group",
        description: "Select a self-help group for this member.",
      });
      return;
    }
    const fd = new FormData();
    fd.append("firstName", firstName.trim());
    fd.append("lastName", lastName.trim());
    if (contactPhone.trim()) fd.append("contactPhone", contactPhone.trim());
    fd.append("gender", gender);
    if (dateOfBirth) fd.append("dateOfBirth", dateOfBirth);
    if (maritalStatus) fd.append("maritalStatus", maritalStatus);
    if (religionId) fd.append("religionId", religionId);
    fd.append("status", status);
    fd.append("selfHelpGroupId", selfHelpGroupId);
    if (fan.trim()) fd.append("fan", fan.trim());
    if (nationalIdFile) fd.append("nationalId", nationalIdFile);

    try {
      const result = await createMutation.mutateAsync(fd);
      sileo.success({ title: "Member created", description: result.message });
      setPage(1);
      dismissAfterExit();
    } catch (error) {
      sileo.error({
        title: "Could not create member",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,50rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Register a member under a self-help group. National ID is optional and can be added
              later.
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
              setStatus={setStatus}
              selfHelpGroupId={selfHelpGroupId}
              setSelfHelpGroupId={setSelfHelpGroupId}
              religionOptions={religionOptions}
              shgOptions={shgOptions}
              nationalIdSection={
                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
                  <Label className="text-foreground">National ID (optional)</Label>
                  <NationalIdDropzone
                    mode="pick"
                    variant="compact"
                    onFileChange={setNationalIdFile}
                    disabled={isSubmitting}
                  />
                </div>
              }
            />
          </div>
          <DialogFooter className="flex justify-end border-t border-border/60 px-6 py-4">
            <SaveButton
              isPending={isSubmitting}
              idleLabel="Create member"
              pendingLabel="Creating…"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
