"use client";

import { useTranslations } from "next-intl";

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
  const tTable = useTranslations("community.members.table");
  const tActions = useTranslations("common.actions");
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
            tTable("columns.approval"),
            tTable("columns.actions"),
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
              <TableCell className={descriptionCellClass}>
                {m.selfHelpGroupName}
              </TableCell>
              <TableCell>{genderLabel(m.gender)}</TableCell>
              <TableCell>
                <StatusBadge status={m.status as EntityStatus} />
              </TableCell>
              <TableCell>
                <ApprovalStatusBadge approvalStatus={m.approvalStatus} />
              </TableCell>
              <TableCell className={tableActionsCellClass}>
                <div className={tableRowActionsClass}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onView(m.id)}
                  >
                    {tActions("view")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(m)}
                  >
                    {tActions("edit")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(m)}
                  >
                    {tActions("delete")}
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
  const tApproval = useTranslations("community.members.options.approval");
  const normalized = (approvalStatus ?? "PENDING").toUpperCase();
  if (normalized === "APPROVED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        {tApproval("approved")}
      </Badge>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <Badge className="border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
        {tApproval("rejected")}
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      {tApproval("pending")}
    </Badge>
  );
}
