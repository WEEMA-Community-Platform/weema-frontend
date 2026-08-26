"use client";

import { useTranslations } from "next-intl";

import { useMemberDetailQuery } from "@/hooks/use-members";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberDetailField } from "@/components/community/members/member-detail-field";
import { StatusBadge } from "@/components/community/community-card";
import {
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
} from "@/components/community/members/constants";
import type { EntityStatus } from "@/lib/api/community";

type MemberDetailDialogProps = {
  id: string | null;
  open: boolean;
  onClose: () => void;
};

function DetailSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-x-8" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-3 sm:gap-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </div>
      ))}
    </div>
  );
}

export function MemberDetailDialog({
  id,
  open,
  onClose,
}: MemberDetailDialogProps) {
  const t = useTranslations("community.members");
  const tDetail = useTranslations("community.members.detail");
  const tActions = useTranslations("common.actions");
  const tGender = useTranslations("community.members.options.gender");
  const tMarital = useTranslations("community.members.options.marital");

  const { data, isPending, isError, error, refetch } = useMemberDetailQuery(id, {
    enabled: open && !!id,
  });
  const member = data?.member;
  const showSkeleton = isPending && !member;

  const genderLabel = (raw: string | null | undefined) => {
    if (!raw) return raw;
    const found = GENDER_OPTIONS.find((o) => o.value === raw);
    return found ? tGender(found.value.toLowerCase() as "male" | "female") : raw;
  };

  const maritalLabel = (raw: string | null | undefined) => {
    if (!raw) return raw;
    const found = MARITAL_OPTIONS.find((o) => o.value === raw);
    return found
      ? tMarital(found.value.toLowerCase() as "single" | "married" | "divorced")
      : raw;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,56rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>
            {member
              ? `${member.firstName} ${member.lastName}`
              : tDetail("titleFallback")}
          </DialogTitle>
          <DialogDescription>{tDetail("description")}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-8 pt-5">
          {showSkeleton ? (
            <DetailSkeleton />
          ) : isError ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : tDetail("loadError")}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                {tActions("retry")}
              </button>
            </div>
          ) : member ? (
            <div className="space-y-6">
              <div className="grid gap-x-8 gap-y-3.5 md:grid-cols-2">
                <MemberDetailField
                  label={t("fields.phone")}
                  value={member.contactPhone}
                />
                <MemberDetailField
                  label={t("fields.gender")}
                  value={genderLabel(member.gender)}
                />
                <MemberDetailField
                  label={t("fields.dateOfBirth")}
                  value={member.dateOfBirth}
                />
                <MemberDetailField
                  label={t("fields.dateJoinedShg")}
                  value={member.dateJoinedShg}
                />
                <MemberDetailField
                  label={t("fields.maritalStatus")}
                  value={maritalLabel(member.maritalStatus)}
                />
                {/*
                <MemberDetailField
                  label={t("fields.religion")}
                  value={member.religionName}
                />
                */}
                <MemberDetailField
                  label={t("fields.status")}
                  value={<StatusBadge status={member.status as EntityStatus} />}
                />
                <MemberDetailField
                  label={t("fields.shg")}
                  value={member.selfHelpGroupName}
                />
                {/*
                <MemberDetailField
                  label={t("fields.fan")}
                  value={member.fan}
                />
                */}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
