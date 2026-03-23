"use client";

import { useMemo, useState } from "react";

import {
  useCreateMemberMutation,
  useDeleteMemberMutation,
  useMembersQuery,
  useUpdateMemberMutation,
  useUploadMemberNationalIdMutation,
} from "@/hooks/use-members";
import { useReligionsQuery } from "@/hooks/use-base-data";
import { useSHGsQuery } from "@/hooks/use-community";
import type { Member } from "@/lib/api/members";
import { MemberCreateDialog } from "@/components/community/members/member-create-dialog";
import { MemberDeleteDialog } from "@/components/community/members/member-delete-dialog";
import { MemberDetailDialog } from "@/components/community/members/member-detail-dialog";
import { MemberEditDialog } from "@/components/community/members/member-edit-dialog";
import { MemberFiltersDialog } from "@/components/community/members/member-filters-dialog";
import { MemberTableCard } from "@/components/community/members/member-table-card";

export function MemberManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterMarital, setFilterMarital] = useState("");
  const [filterShgId, setFilterShgId] = useState("");
  const [filterReligionId, setFilterReligionId] = useState("");
  const [filterDobFrom, setFilterDobFrom] = useState("");
  const [filterDobTo, setFilterDobTo] = useState("");
  const [filterAgeFrom, setFilterAgeFrom] = useState("");
  const [filterAgeTo, setFilterAgeTo] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDialogKey, setCreateDialogKey] = useState(0);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editDialogKey, setEditDialogKey] = useState(0);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);

  const membersQuery = useMembersQuery({
    page,
    pageSize: 10,
    searchQuery,
    status: filterStatus || undefined,
    gender: filterGender || undefined,
    maritalStatus: filterMarital || undefined,
    shgId: filterShgId || undefined,
    religionId: filterReligionId || undefined,
    dateOfBirthFrom: filterDobFrom || undefined,
    dateOfBirthTo: filterDobTo || undefined,
    ageFrom: filterAgeFrom ? parseInt(filterAgeFrom, 10) : undefined,
    ageTo: filterAgeTo ? parseInt(filterAgeTo, 10) : undefined,
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
  const deleteMutation = useDeleteMemberMutation();
  const uploadIdMutation = useUploadMemberNationalIdMutation();

  const hasActiveFilters = Boolean(
    filterStatus ||
      filterGender ||
      filterMarital ||
      filterShgId ||
      filterReligionId ||
      filterDobFrom ||
      filterDobTo ||
      filterAgeFrom ||
      filterAgeTo
  );

  const isSubmittingCreate = createMutation.isPending;
  const isSubmittingEdit = updateMutation.isPending;

  const filterState = useMemo(
    () => ({
      filterStatus,
      setFilterStatus,
      filterGender,
      setFilterGender,
      filterMarital,
      setFilterMarital,
      filterShgId,
      setFilterShgId,
      filterReligionId,
      setFilterReligionId,
      filterDobFrom,
      setFilterDobFrom,
      filterDobTo,
      setFilterDobTo,
      filterAgeFrom,
      setFilterAgeFrom,
      filterAgeTo,
      setFilterAgeTo,
    }),
    [
      filterStatus,
      filterGender,
      filterMarital,
      filterShgId,
      filterReligionId,
      filterDobFrom,
      filterDobTo,
      filterAgeFrom,
      filterAgeTo,
    ]
  );

  const list = membersQuery.data;

  const isFormOpen = isCreateOpen || !!editingMember;
  /** View dialog is independent: hidden while add/edit is open; never stacks with form. */
  const isViewOpen = !!viewingId && !isFormOpen;

  return (
    <>
      <MemberCreateDialog
        key={`create-${createDialogKey}`}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        religionOptions={religionOptions}
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
      />

      <MemberDetailDialog
        id={viewingId}
        open={isViewOpen}
        onClose={() => setViewingId(null)}
        uploadIdMutation={uploadIdMutation}
      />

      <MemberTableCard
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
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
      />

      <MemberFiltersDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filterState}
        shgOptions={shgOptions}
        religionOptions={religionOptions}
        onPageReset={() => setPage(1)}
      />

      <MemberDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        member={pendingDelete}
        deleteMutation={deleteMutation}
      />
    </>
  );
}
