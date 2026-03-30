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
import { StatusBadge } from "@/components/community/community-card";
import { Badge } from "@/components/ui/badge";
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
          headers={["Name", "Phone", "Self-help group", "Gender", "Status", "Approval", "Actions"]}
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
                <ApprovalStatusBadge approvalStatus={m.approvalStatus} />
              </TableCell>
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button type="button" size="sm" variant="outline" onClick={() => onView(m.id)}>
                    View
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onEdit(m)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(m)}>
                    Delete
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

function ApprovalStatusBadge({ approvalStatus }: { approvalStatus?: string }) {
  const normalized = (approvalStatus ?? "PENDING").toUpperCase();
  if (normalized === "APPROVED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        Approved
      </Badge>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <Badge className="border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      Pending
    </Badge>
  );
}
