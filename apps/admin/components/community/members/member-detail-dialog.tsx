"use client";

import { ExternalLinkIcon } from "lucide-react";
import { sileo } from "sileo";

import { useMemberDetailQuery, useUploadMemberNationalIdMutation } from "@/hooks/use-members";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberDetailField } from "@/components/community/members/member-detail-field";
import { NationalIdDropzone } from "@/components/community/members/national-id-dropzone";
import { StatusBadge } from "@/components/community/community-card";
import type { EntityStatus } from "@/lib/api/community";

type MemberDetailDialogProps = {
  id: string | null;
  open: boolean;
  onClose: () => void;
  uploadIdMutation: ReturnType<typeof useUploadMemberNationalIdMutation>;
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
  uploadIdMutation,
}: MemberDetailDialogProps) {
  const { data, isPending, refetch } = useMemberDetailQuery(id, {
    enabled: open && !!id,
  });
  const member = data?.member;
  /** Avoid skeleton flash when cached data exists (refetch in background). */
  const showSkeleton = isPending && !member;

  const handleUpload = async (file: File) => {
    if (!id) return;
    try {
      const result = await uploadIdMutation.mutateAsync({ memberId: id, file });
      sileo.success({ title: "National ID uploaded", description: result.message });
      await refetch();
    } catch (error) {
      sileo.error({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,56rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>
            {member ? `${member.firstName} ${member.lastName}` : "Member details"}
          </DialogTitle>
          <DialogDescription>Profile, program details, and identification documents.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-5">
          {showSkeleton ? (
            <DetailSkeleton />
          ) : member ? (
            <div className="space-y-6">
              <div className="grid gap-x-8 gap-y-3.5 md:grid-cols-2">
                <MemberDetailField label="Phone" value={member.contactPhone} />
                <MemberDetailField label="Gender" value={member.gender} />
                <MemberDetailField label="Date of birth" value={member.dateOfBirth} />
                <MemberDetailField label="Marital status" value={member.maritalStatus} />
                <MemberDetailField label="Religion" value={member.religionName} />
                <MemberDetailField
                  label="Status"
                  value={<StatusBadge status={member.status as EntityStatus} />}
                />
                <MemberDetailField label="Self-help group" value={member.selfHelpGroupName} />
                <MemberDetailField label="FAN" value={member.fan} />
                <div className="md:col-span-2">
                  <MemberDetailField
                    label="National ID"
                    value={
                      member.nationalIdUrl ? (
                        <a
                          href={member.nationalIdUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
                        >
                          Open document
                          <ExternalLinkIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not uploaded yet</span>
                      )
                    }
                  />
                </div>
              </div>

              <section
                className="rounded-xl border border-border/60 bg-muted/15 p-4"
                aria-labelledby="national-id-upload-heading"
              >
                <h3 id="national-id-upload-heading" className="text-sm font-semibold text-foreground">
                  National ID
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Upload or replace a scanned image or PDF. The file is sent securely to the server.
                </p>
                <div className="mt-4">
                  <NationalIdDropzone
                    mode="upload"
                    isUploading={uploadIdMutation.isPending}
                    onUpload={handleUpload}
                  />
                </div>
              </section>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load this member.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
