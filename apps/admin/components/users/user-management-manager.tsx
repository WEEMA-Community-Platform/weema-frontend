"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  useCreateUserMutation,
  useToggleUserActivationMutation,
  useUsersQuery,
} from "@/hooks/use-users-admin";
import type { UserListItem } from "@/lib/api/users-admin";
import { UserCreateDialog } from "@/components/users/user-create-dialog";
import { UserDetailDialog } from "@/components/users/user-detail-dialog";
import { UserFiltersDialog, type UserAppliedFilters } from "@/components/users/user-filters-dialog";
import { UserTableCard } from "@/components/users/user-table-card";
import { UserToggleDialog } from "@/components/users/user-toggle-dialog";

export function UserManagementManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [appliedFilterRole, setAppliedFilterRole] = useState("");
  const [appliedFilterActive, setAppliedFilterActive] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [toggleUser, setToggleUser] = useState<UserListItem | null>(null);

  const tEmpty = useTranslations("listEmpty");
  const tEntity = useTranslations("listEmpty.entity");
  const tList = useTranslations("users.list");

  const listQuery = useUsersQuery({
    page,
    pageSize: 10,
    searchQuery: searchQuery || undefined,
    roles: appliedFilterRole ? [appliedFilterRole] : undefined,
    isActive: appliedFilterActive === "" ? undefined : appliedFilterActive === "true",
  });

  const createMutation = useCreateUserMutation();
  const toggleMutation = useToggleUserActivationMutation();

  const hasActiveFilters = Boolean(appliedFilterRole || appliedFilterActive);

  const appliedFilters: UserAppliedFilters = useMemo(
    () => ({ role: appliedFilterRole, active: appliedFilterActive }),
    [appliedFilterRole, appliedFilterActive]
  );

  const hasSearch = Boolean(searchQuery.trim());
  const entity = tEntity("users");
  const emptyMessage =
    hasSearch && hasActiveFilters
      ? tEmpty("searchAndFilters", { entity })
      : hasSearch
        ? tEmpty("searchOnly", { entity })
        : hasActiveFilters
          ? tEmpty("filtersOnly", { entity })
          : tList("emptyHint");

  const list = listQuery.data;

  const isViewOpen = !!viewingId && !isCreateOpen;

  const applyUserFilters = (f: UserAppliedFilters) => {
    setAppliedFilterRole(f.role);
    setAppliedFilterActive(f.active);
    setPage(1);
    setIsFilterOpen(false);
  };

  return (
    <>
      <UserCreateDialog
        key={`create-${createKey}`}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        createMutation={createMutation}
        setPage={setPage}
      />

      <UserDetailDialog
        id={viewingId}
        open={isViewOpen}
        onClose={() => setViewingId(null)}
      />

      <UserToggleDialog
        user={toggleUser}
        open={!!toggleUser}
        onOpenChange={(open) => {
          if (!open) setToggleUser(null);
        }}
        toggleMutation={toggleMutation}
      />

      <UserTableCard
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onAdd={() => {
          setCreateKey((k) => k + 1);
          setIsCreateOpen(true);
        }}
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        errorMessage={listQuery.error instanceof Error ? listQuery.error.message : undefined}
        onRetry={listQuery.refetch}
        users={list?.users}
        currentPage={list?.currentPage ?? 1}
        totalPages={list?.totalPages ?? 1}
        totalElements={list?.totalElements ?? 0}
        onPageChange={setPage}
        emptyMessage={emptyMessage}
        onView={(id) => {
          setViewingId(id);
        }}
        onToggleActivation={setToggleUser}
      />

      <UserFiltersDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        applied={appliedFilters}
        onApply={applyUserFilters}
      />
    </>
  );
}
