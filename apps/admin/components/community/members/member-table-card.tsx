"use client";

import { EyeIcon, LockIcon, MoreVerticalIcon, PencilIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LockedBadge, StatusBadge } from "@/components/community/community-card";
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
  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Members</CardTitle>
        <DataToolbar
          searchPlaceholder="Search name, phone, SHG, religion…"
          searchValue={searchQuery}
          onSearchChange={onSearchChange}
          onAdd={onAdd}
          addLabel="Add member"
          showFilterButton
          onOpenFilters={onOpenFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </CardHeader>
      <CardContent>
        <TableShell
          headers={["Name", "Phone", "Self-help group", "Gender", "Status", "Locked", ""]}
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
              <TableCell className="text-muted-foreground">{m.contactPhone ?? "—"}</TableCell>
              <TableCell className={descriptionCellClass}>{m.selfHelpGroupName}</TableCell>
              <TableCell>{m.gender}</TableCell>
              <TableCell>
                <StatusBadge status={m.status as EntityStatus} />
              </TableCell>
              <TableCell>
                <LockedBadge locked={m.locked} />
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
                        aria-label="Open member actions"
                      >
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="text-[12px]" onClick={() => onView(m.id)}>
                        <EyeIcon />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[12px]" onClick={() => onEdit(m)}>
                        <PencilIcon />
                        Edit
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
                          Unlock
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-[12px] text-slate-500 focus:text-slate-700"
                          onClick={() => onLock(m)}
                        >
                          <LockIcon />
                          Lock
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
                        Delete
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
