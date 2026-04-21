"use client";

import { EyeIcon, LockIcon, MoreVerticalIcon, PencilIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataToolbar,
  EmptyStateRow,
  PaginationRow,
  TableShell,
  descriptionCellClass,
} from "@/components/base-data/shared";
import { StatusBadge } from "@/components/community/community-card";
import { GENDER_OPTIONS } from "@/components/community/members/constants";
import type { Member } from "@/lib/api/members";
import type { EntityStatus } from "@/lib/api/community";

type MemberTableCardProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  members: Member[] | undefined;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onView: (id: string) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onLock: (member: Member) => void;
  onUnlock: (member: Member) => void;
  emptyMessage: string;
};

export function MemberTableCard({
  searchQuery,
  onSearchChange,
  onAdd,
  onOpenFilters,
  hasActiveFilters,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  members,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onLock,
  onUnlock,
  emptyMessage,
}: MemberTableCardProps) {
  const tTable = useTranslations("community.members.table");
  const tActions = useTranslations("common.actions");
  const tMemberActions = useTranslations("community.members.actions");
  const tEmpty = useTranslations("common.empty");
  const tGender = useTranslations("community.members.options.gender");

  const genderLabel = (raw: string) => {
    const found = GENDER_OPTIONS.find((o) => o.value === raw);
    return found ? tGender(found.value.toLowerCase() as "male" | "female") : raw;
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{tTable("title")}</CardTitle>
        <DataToolbar
          searchPlaceholder={tTable("searchPlaceholder")}
          searchValue={searchQuery}
          onSearchChange={onSearchChange}
          onAdd={onAdd}
          addLabel={tTable("addButton")}
          showFilterButton
          onOpenFilters={onOpenFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={[
            tTable("columns.name"),
            tTable("columns.phone"),
            tTable("columns.shg"),
            tTable("columns.gender"),
            tTable("columns.status"),
            tTable("columns.locked"),
            "",
          ]}
          loading={isLoading}
          loadingColumnCount={7}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={onRetry}
          emptyState={<EmptyStateRow colSpan={7} message={emptyMessage} />}
        >
          {members?.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                {m.firstName} {m.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.contactPhone ?? tEmpty("dash")}
              </TableCell>
              <TableCell className={descriptionCellClass}>{m.selfHelpGroupName}</TableCell>
              <TableCell>{genderLabel(m.gender)}</TableCell>
              <TableCell>
                <StatusBadge status={m.status as EntityStatus} />
              </TableCell>
              <TableCell>
                <LocalLockedBadge locked={m.locked} />
              </TableCell>
              <TableCell className="w-10 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        aria-label={tTable("columns.openMenu")}
                      >
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="text-[12px]" onClick={() => onView(m.id)}>
                        <EyeIcon />
                        {tActions("viewDetails")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[12px]" onClick={() => onEdit(m)}>
                        <PencilIcon />
                        {tActions("edit")}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {m.locked ? (
                        <DropdownMenuItem
                          className="text-[12px] text-amber-600 focus:text-amber-600"
                          onClick={() => onUnlock(m)}
                        >
                          <UnlockIcon />
                          {tMemberActions("unlock")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-[12px] text-slate-500 focus:text-slate-700"
                          onClick={() => onLock(m)}
                        >
                          <LockIcon />
                          {tMemberActions("lock")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        className="text-[12px]"
                        variant="destructive"
                        onClick={() => onDelete(m)}
                      >
                        <Trash2Icon />
                        {tActions("delete")}
                      </DropdownMenuItem>
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

function LocalLockedBadge({ locked }: { locked: boolean }) {
  const tLocked = useTranslations("community.members.options.locked");
  if (locked) {
    return (
      <Badge className="gap-1 border-transparent bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">
        <LockIcon className="size-3" />
        {tLocked("locked")}
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 border-transparent bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
      <UnlockIcon className="size-3" />
      {tLocked("unlocked")}
    </Badge>
  );
}
