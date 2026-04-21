"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  MIN_MEMBER_AGE_YEARS,
  isAtLeastAge,
} from "@/components/community/members/constants";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BaseApiResponse } from "@/lib/api/base-data";

type CreateMutation = UseMutationResult<BaseApiResponse, Error, FormData, unknown>;

type MemberCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    dateJoinedShg: "",
    maritalStatus: "",
    status: "",
    selfHelpGroupId: "",
    fan: "",
    nationalIdFile: null as File | null,
  };
}

export function MemberCreateDialog({
  open,
  onOpenChange,
  shgOptions,
  createMutation,
  isSubmitting,
  setPage,
}: MemberCreateDialogProps) {
  const t = useTranslations("community.members");
  const tCreate = useTranslations("community.members.create");
  const tCommon = useTranslations("common.validation");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateJoinedShg, setDateJoinedShg] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
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
    setDateJoinedShg(e.dateJoinedShg);
    setMaritalStatus(e.maritalStatus);
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
        title: t("validation.nameRequiredTitle"),
        description: t("validation.nameRequiredMessage"),
      });
      return;
    }
    if (!gender) {
      sileo.warning({
        title: t("validation.genderTitle"),
        description: t("validation.genderMessage"),
      });
      return;
    }
    if (!status) {
      sileo.warning({
        title: t("validation.statusTitle"),
        description: t("validation.statusMessage"),
      });
      return;
    }
    if (!maritalStatus) {
      sileo.warning({
        title: t("validation.maritalTitle"),
        description: t("validation.maritalMessage"),
      });
      return;
    }
    if (!dateOfBirth) {
      sileo.warning({
        title: t("validation.dobTitle"),
        description: t("validation.dobMessage"),
      });
      return;
    }
    if (!isAtLeastAge(dateOfBirth, MIN_MEMBER_AGE_YEARS)) {
      sileo.warning({
        title: t("validation.invalidAgeTitle"),
        description: t("validation.invalidAgeMessage", {
          years: MIN_MEMBER_AGE_YEARS,
        }),
      });
      return;
    }
    if (!selfHelpGroupId) {
      sileo.warning({
        title: t("validation.shgTitle"),
        description: t("validation.shgMessage"),
      });
      return;
    }
    const fd = new FormData();
    fd.append("firstName", firstName.trim());
    fd.append("lastName", lastName.trim());
    if (contactPhone.trim()) fd.append("contactPhone", contactPhone.trim());
    fd.append("gender", gender);
    fd.append("dateOfBirth", dateOfBirth);
    if (dateJoinedShg) fd.append("dateJoinedShg", dateJoinedShg);
    fd.append("maritalStatus", maritalStatus);
    fd.append("status", status);
    fd.append("selfHelpGroupId", selfHelpGroupId);
    if (fan.trim()) fd.append("fan", fan.trim());
    if (nationalIdFile) fd.append("nationalId", nationalIdFile);

    try {
      const result = await createMutation.mutateAsync(fd);
      sileo.success({
        title: tCreate("toasts.createdTitle"),
        description: result.message,
      });
      setPage(1);
      dismissAfterExit();
    } catch (error) {
      sileo.error({
        title: tCreate("toasts.errorTitle"),
        description:
          error instanceof Error ? error.message : tCommon("unexpectedError"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,50rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
            <DialogTitle>{tCreate("title")}</DialogTitle>
            <DialogDescription>{tCreate("description")}</DialogDescription>
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
              dateJoinedShg={dateJoinedShg}
              setDateJoinedShg={setDateJoinedShg}
              fan={fan}
              setFan={setFan}
              gender={gender}
              setGender={setGender}
              maritalStatus={maritalStatus}
              setMaritalStatus={setMaritalStatus}
              status={status}
              setStatus={setStatus}
              selfHelpGroupId={selfHelpGroupId}
              setSelfHelpGroupId={setSelfHelpGroupId}
              shgOptions={shgOptions}
              showReligionField={false}
              nationalIdSection={
                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
                  <Label className="text-foreground">{t("fields.nationalIdOptional")}</Label>
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
              idleLabel={tCreate("submit")}
              pendingLabel={tCreate("submitting")}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
