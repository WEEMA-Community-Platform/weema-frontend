"use client";

import { useTranslations } from "next-intl";
import { EyeIcon, MoreVerticalIcon, ShieldIcon, KeyRoundIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
} from "@/components/base-data/shared";
import type { UserListItem } from "@/lib/api/users-admin";
import { useRoleLabel } from "@/components/users/constants";
import { useIsViewerAdmin } from "@/hooks/use-viewer-admin";
import { useCurrentUser } from "@/hooks/use-user";
import { SUPER_ADMIN_ROLE } from "@/components/users/constants";

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
  onChangeRole: (user: UserListItem) => void;
  onResetPassword: (user: UserListItem) => void;
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
  onChangeRole,
  onResetPassword,
  emptyMessage,
}: UserTableCardProps) {
  const t = useTranslations("users.list");
  const tCols = useTranslations("users.list.columns");
  const tCell = useTranslations("users.list.cell");
  const tRow = useTranslations("users.list.rowActions");
  const roleLabel = useRoleLabel();
  const isViewerAdmin = useIsViewerAdmin();
  const { data: currentUser } = useCurrentUser();
  const canManage = currentUser?.user.role === SUPER_ADMIN_ROLE;

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t("title")}</CardTitle>
        <DataToolbar
          searchPlaceholder={t("searchPlaceholder")}
          searchValue={searchQuery}
          onSearchChange={onSearchChange}
          onAdd={onAdd}
          addLabel={t("addButton")}
          showFilterButton
          onOpenFilters={onOpenFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={[
            tCols("name"),
            tCols("email"),
            tCols("role"),
            tCols("phone"),
            tCols("active"),
            tCols("firstLogin"),
            tCols("actions"),
          ]}
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
              <TableCell className="capitalize">{roleLabel(u.role)}</TableCell>
              <TableCell className={descriptionCellClass}>{u.phoneNumber ?? "—"}</TableCell>
              <TableCell>{u.active ? tCell("yes") : tCell("no")}</TableCell>
              <TableCell>{u.firstTimeLogin ? tCell("yes") : tCell("no")}</TableCell>
              <TableCell className={tableActionsCellClass}>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={tRow("openMenu")}><MoreVerticalIcon className="size-4" /></Button>} />
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => onView(u.id)}><EyeIcon />{tRow("view")}</DropdownMenuItem>
                      {!isViewerAdmin ? <DropdownMenuItem onClick={() => onToggleActivation(u)}>
                        {u.active ? <UserXIcon /> : <UserCheckIcon />}{u.active ? tRow("deactivate") : tRow("activate")}
                      </DropdownMenuItem> : null}
                      {canManage && u.role !== SUPER_ADMIN_ROLE ? <>
                        <DropdownMenuItem onClick={() => onChangeRole(u)}><ShieldIcon />{tRow("changeRole")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword(u)}><KeyRoundIcon />{tRow("resetPassword")}</DropdownMenuItem>
                      </> : null}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
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
