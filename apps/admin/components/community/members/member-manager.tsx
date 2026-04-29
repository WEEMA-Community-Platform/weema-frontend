"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";

import {
  useCreateMemberMutation,
  useDeleteMemberMutation,
  useLockMemberMutation,
  useMembersQuery,
  useUnlockMemberMutation,
  useUpdateMemberMutation,
  useUploadMemberNationalIdMutation,
} from "@/hooks/use-members";
import { useReligionsQuery } from "@/hooks/use-base-data";
import { useSHGsQuery } from "@/hooks/use-community";
import type { Member } from "@/lib/api/members";
import { exportMembersList } from "@/lib/api/members";
import { buildBaseDataCsv, downloadBaseDataCsv, exportFilename } from "@/lib/base-data-csv";
import { GENDER_OPTIONS } from "@/components/community/members/constants";
import { MemberCreateDialog } from "@/components/community/members/member-create-dialog";
import { MemberDeleteDialog } from "@/components/community/members/member-delete-dialog";
import { MemberDetailDialog } from "@/components/community/members/member-detail-dialog";
import { MemberEditDialog } from "@/components/community/members/member-edit-dialog";
import {
  MemberFiltersDialog,
  type MemberAppliedFilters,
} from "@/components/community/members/member-filters-dialog";
import { MemberLockDialog } from "@/components/community/members/member-lock-dialog";
import { MemberTableCard } from "@/components/community/members/member-table-card";

export function MemberManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedIsLocked, setAppliedIsLocked] = useState("");
  const [appliedGender, setAppliedGender] = useState("");
  const [appliedMarital, setAppliedMarital] = useState("");
  const [appliedShgId, setAppliedShgId] = useState("");
  const [appliedReligionId, setAppliedReligionId] = useState("");
  const [appliedDobFrom, setAppliedDobFrom] = useState("");
  const [appliedDobTo, setAppliedDobTo] = useState("");
  const [appliedAgeFrom, setAppliedAgeFrom] = useState("");
  const [appliedAgeTo, setAppliedAgeTo] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDialogKey, setCreateDialogKey] = useState(0);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editDialogKey, setEditDialogKey] = useState(0);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [pendingLock, setPendingLock] = useState<{ member: Member; action: "lock" | "unlock" } | null>(null);
  const [exportPending, setExportPending] = useState(false);

  const isLockedFilter =
    appliedIsLocked === "true" ? true : appliedIsLocked === "false" ? false : undefined;

  const membersQuery = useMembersQuery({
    page,
    pageSize: 10,
    searchQuery,
    status: appliedStatus || undefined,
    isLocked: isLockedFilter,
    gender: appliedGender || undefined,
    maritalStatus: appliedMarital || undefined,
    shgId: appliedShgId || undefined,
    religionId: appliedReligionId || undefined,
    dateOfBirthFrom: appliedDobFrom || undefined,
    dateOfBirthTo: appliedDobTo || undefined,
    ageFrom: appliedAgeFrom ? parseInt(appliedAgeFrom, 10) : undefined,
    ageTo: appliedAgeTo ? parseInt(appliedAgeTo, 10) : undefined,
  });

  const { data: religionsData } = useReligionsQuery({ page: 1, pageSize: 200 });
  const { data: shgsData } = useSHGsQuery({ page: 1, pageSize: 200 });

  const religionOptions = useMemo(
    () => (religionsData?.religions ?? []).map((r) => ({ value: r.id, label: r.name })),
    [religionsData?.religions]
  );
  const shgOptions = useMemo(
    () => (shgsData?.selfHelpGroups ?? []).map((s) => ({ value: s.id, label: s.name })),
    [shgsData?.selfHelpGroups]
  );

  const createMutation = useCreateMemberMutation();
  const updateMutation = useUpdateMemberMutation();
  const lockMutation = useLockMemberMutation();
  const unlockMutation = useUnlockMemberMutation();
  const deleteMutation = useDeleteMemberMutation();
  const uploadIdMutation = useUploadMemberNationalIdMutation();

  const hasActiveFilters = Boolean(
    appliedStatus ||
      appliedIsLocked ||
      appliedGender ||
      appliedMarital ||
      appliedShgId ||
      appliedReligionId ||
      appliedDobFrom ||
      appliedDobTo ||
      appliedAgeFrom ||
      appliedAgeTo
  );

  const appliedFilters: MemberAppliedFilters = useMemo(
    () => ({
      status: appliedStatus,
      isLocked: appliedIsLocked,
      gender: appliedGender,
      marital: appliedMarital,
      shgId: appliedShgId,
      religionId: appliedReligionId,
      dobFrom: appliedDobFrom,
      dobTo: appliedDobTo,
      ageFrom: appliedAgeFrom,
      ageTo: appliedAgeTo,
    }),
    [appliedStatus, appliedIsLocked, appliedGender, appliedMarital, appliedShgId, appliedReligionId, appliedDobFrom, appliedDobTo, appliedAgeFrom, appliedAgeTo]
  );

  const hasSearch = Boolean(searchQuery.trim());
  const tListEmpty = useTranslations("listEmpty");
  const tListEntity = useTranslations("listEmpty.entity");
  const tTable = useTranslations("community.members.table");
  const tExport = useTranslations("community.export");
  const tMemCols = useTranslations("community.export.member.columns");
  const tGender = useTranslations("community.members.options.gender");
  const tMarital = useTranslations("community.members.options.marital");
  const tMemStatus = useTranslations("community.members.options.status");
  const tCommonBase = useTranslations("basedata.common");
  const tValidation = useTranslations("common.validation");
  const entityPlural = tListEntity("members");
  const emptyMessage =
    hasSearch && hasActiveFilters
      ? tListEmpty("searchAndFilters", { entity: entityPlural })
      : hasSearch
        ? tListEmpty("searchOnly", { entity: entityPlural })
        : hasActiveFilters
          ? tListEmpty("filtersOnly", { entity: entityPlural })
          : tTable("emptyHint");

  const isSubmittingCreate = createMutation.isPending;
  const isSubmittingEdit = updateMutation.isPending;

  const list = membersQuery.data;
  const isFormOpen = isCreateOpen || !!editingMember;
  const isViewOpen = !!viewingId && !isFormOpen;

  const applyMemberFilters = (f: MemberAppliedFilters) => {
    setAppliedStatus(f.status);
    setAppliedIsLocked(f.isLocked);
    setAppliedGender(f.gender);
    setAppliedMarital(f.marital);
    setAppliedShgId(f.shgId);
    setAppliedReligionId(f.religionId);
    setAppliedDobFrom(f.dobFrom);
    setAppliedDobTo(f.dobTo);
    setAppliedAgeFrom(f.ageFrom);
    setAppliedAgeTo(f.ageTo);
    setPage(1);
    setIsFilterOpen(false);
  };

  const genderExportLabel = (raw: unknown) => {
    const v = String(raw ?? "");
    const found = GENDER_OPTIONS.find((o) => o.value === v);
    return found ? tGender(found.value.toLowerCase() as "male" | "female") : v;
  };

  const maritalExportLabel = (raw: unknown) => {
    if (raw == null || raw === "") return "";
    const upper = String(raw).toUpperCase();
    const map = {
      SINGLE: "single",
      MARRIED: "married",
      DIVORCED: "divorced",
      WIDOWED: "widowed",
    } as const;
    const key = map[upper as keyof typeof map];
    return key ? tMarital(key) : String(raw);
  };

  const memberStatusExportLabel = (raw: unknown) => {
    const upper = String(raw ?? "").toUpperCase();
    if (upper === "ACTIVE") return tMemStatus("active");
    if (upper === "INACTIVE") return tMemStatus("inactive");
    return String(raw ?? "");
  };

  const exportCsv = async () => {
    const str = (v: unknown) => (v == null ? "" : String(v));
    setExportPending(true);
    try {
      const { data } = await exportMembersList();
      if (data.length === 0) {
        sileo.warning({
          title: tExport("emptyTitle"),
          description: tExport("emptyDescription"),
        });
        return;
      }
      const columns = [
        { header: tMemCols("firstName"), cell: (r: Record<string, unknown>) => str(r.firstName) },
        { header: tMemCols("lastName"), cell: (r: Record<string, unknown>) => str(r.lastName) },
        { header: tMemCols("phone"), cell: (r: Record<string, unknown>) => str(r.contactPhone) },
        { header: tMemCols("gender"), cell: (r: Record<string, unknown>) => genderExportLabel(r.gender) },
        { header: tMemCols("dateOfBirth"), cell: (r: Record<string, unknown>) => str(r.dateOfBirth) },
        {
          header: tMemCols("maritalStatus"),
          cell: (r: Record<string, unknown>) => maritalExportLabel(r.maritalStatus),
        },
        { header: tMemCols("fan"), cell: (r: Record<string, unknown>) => str(r.fan) },
        { header: tMemCols("dateJoinedShg"), cell: (r: Record<string, unknown>) => str(r.dateJoinedShg) },
        {
          header: tMemCols("status"),
          cell: (r: Record<string, unknown>) => memberStatusExportLabel(r.status),
        },
        { header: tMemCols("religion"), cell: (r: Record<string, unknown>) => str(r.religionName) },
        {
          header: tMemCols("shg"),
          cell: (r: Record<string, unknown>) => str(r.selfHelpGroupName),
        },
        { header: tMemCols("cluster"), cell: (r: Record<string, unknown>) => str(r.clusterName) },
        {
          header: tMemCols("locked"),
          cell: (r: Record<string, unknown>) =>
            r.locked === true || r.locked === "true" ? tCommonBase("yes") : tCommonBase("no"),
        },
        { header: tMemCols("createdAt"), cell: (r: Record<string, unknown>) => str(r.createdAt) },
        { header: tMemCols("updatedAt"), cell: (r: Record<string, unknown>) => str(r.updatedAt) },
      ];
      const csv = buildBaseDataCsv(columns, data);
      downloadBaseDataCsv(csv, exportFilename("members"));
      sileo.success({
        title: tExport("successTitle"),
        description: tExport("successDescription", { count: data.length }),
      });
    } catch (error) {
      sileo.error({
        title: tExport("errorTitle"),
        description: error instanceof Error ? error.message : tValidation("unexpectedError"),
      });
    } finally {
      setExportPending(false);
    }
  };

  return (
    <>
      <MemberCreateDialog
        key={`create-${createDialogKey}`}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        shgOptions={shgOptions}
        createMutation={createMutation}
        isSubmitting={isSubmittingCreate}
        setPage={setPage}
      />

      <MemberEditDialog
        key={`edit-${editDialogKey}`}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onDismiss={() => setViewingId(null)}
        religionOptions={religionOptions}
        shgOptions={shgOptions}
        updateMutation={updateMutation}
        isSubmitting={isSubmittingEdit}
        onRequestLock={(m) => setPendingLock({ member: m, action: "lock" })}
        onRequestUnlock={(m) => setPendingLock({ member: m, action: "unlock" })}
      />

      <MemberDetailDialog
        id={viewingId}
        open={isViewOpen}
        onClose={() => setViewingId(null)}
        uploadIdMutation={uploadIdMutation}
      />

      <MemberTableCard
        searchQuery={searchQuery}
        onSearchChange={(value) => { setSearchQuery(value); setPage(1); }}
        onAdd={() => {
          setEditingMember(null);
          setCreateDialogKey((k) => k + 1);
          setIsCreateOpen(true);
        }}
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
        isLoading={membersQuery.isLoading}
        isError={membersQuery.isError}
        errorMessage={membersQuery.error instanceof Error ? membersQuery.error.message : undefined}
        onRetry={membersQuery.refetch}
        members={list?.members}
        currentPage={list?.currentPage ?? 1}
        totalPages={list?.totalPages ?? 1}
        totalElements={list?.totalElements ?? 0}
        onPageChange={setPage}
        emptyMessage={emptyMessage}
        onView={(id) => {
          setIsCreateOpen(false);
          setEditingMember(null);
          setViewingId(id);
        }}
        onEdit={(m) => {
          setEditDialogKey((k) => k + 1);
          setEditingMember(m);
        }}
        onDelete={setPendingDelete}
        onLock={(m) => setPendingLock({ member: m, action: "lock" })}
        onUnlock={(m) => setPendingLock({ member: m, action: "unlock" })}
        onExport={exportCsv}
        exportLabel={tExport("button")}
        exportPendingLabel={tExport("exporting")}
        exportPending={exportPending}
      />

      <MemberFiltersDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        applied={appliedFilters}
        onApply={applyMemberFilters}
        shgOptions={shgOptions}
        religionOptions={religionOptions}
      />

      <MemberDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        member={pendingDelete}
        deleteMutation={deleteMutation}
      />

      <MemberLockDialog
        member={pendingLock?.member ?? null}
        action={pendingLock?.action ?? "lock"}
        onOpenChange={(open) => { if (!open) setPendingLock(null); }}
        lockMutation={lockMutation}
        unlockMutation={unlockMutation}
      />
    </>
  );
}
