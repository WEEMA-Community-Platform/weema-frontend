"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DataToolbar,
  EmptyStateRow,
  PaginationRow,
  TableShell,
  descriptionCellClass,
  tableActionsCellClass,
  tableRowActionsClass,
} from "@/components/base-data/shared";
import type { UserListItem } from "@/lib/api/users-admin";
import { formatRoleLabel } from "@/components/users/constants";

type UserTableCardProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  users: UserListItem[] | undefined;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onView: (id: string) => void;
  onToggleActivation: (user: UserListItem) => void;
  emptyMessage: string;
};

export function UserTableCard({
  searchQuery,
  onSearchChange,
  onAdd,
  onOpenFilters,
  hasActiveFilters,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  users,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  onView,
  onToggleActivation,
  emptyMessage,
}: UserTableCardProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Users</CardTitle>
        <DataToolbar
          searchPlaceholder="Search by name or email…"
          searchValue={searchQuery}
          onSearchChange={onSearchChange}
          onAdd={onAdd}
          addLabel="Add user"
          showFilterButton
          onOpenFilters={onOpenFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Email", "Role", "Phone", "Active", "First login", "Actions"]}
          loading={isLoading}
          loadingColumnCount={7}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={<EmptyStateRow colSpan={7} message={emptyMessage} />}
        >
          {users?.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">
                {u.firstName} {u.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="capitalize">{formatRoleLabel(u.role)}</TableCell>
              <TableCell className={descriptionCellClass}>{u.phoneNumber ?? "—"}</TableCell>
              <TableCell>{u.active ? "Yes" : "No"}</TableCell>
              <TableCell>{u.firstTimeLogin ? "Yes" : "No"}</TableCell>
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button type="button" size="sm" variant="outline" onClick={() => onView(u.id)}>
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={u.active ? "outline" : "default"}
                    onClick={() => onToggleActivation(u)}
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        {totalElements > 0 && (
          <PaginationRow
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            onPrev={() => onPageChange(Math.max(1, currentPage - 1))}
            onNext={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          />
        )}
      </CardContent>
    </Card>
  );
}
