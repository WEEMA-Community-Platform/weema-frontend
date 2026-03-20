"use client";

import { Loader2, Plus, SlidersHorizontal } from "lucide-react";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const inputClass = "h-11 text-[0.95rem] md:text-base";
export const descriptionCellClass =
  "max-w-[34ch] whitespace-normal break-words text-muted-foreground line-clamp-2";

export function DataToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onAdd,
  addLabel,
  onOpenFilters,
  showFilterButton = false,
  hasActiveFilters = false,
}: {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
  onOpenFilters?: () => void;
  showFilterButton?: boolean;
  hasActiveFilters?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder={searchPlaceholder}
        value={searchValue}
        className={`${inputClass} w-full sm:w-[260px]`}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {showFilterButton && onOpenFilters && (
        <Button
          type="button"
          variant="outline"
          className="h-11 border-primary/30"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="size-4" />
          {hasActiveFilters ? "Filters applied" : "Filters"}
        </Button>
      )}
      <Button
        type="button"
        className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={onAdd}
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}

export function TableShell({
  headers,
  children,
  emptyState,
  loading,
  loadingColumnCount,
}: {
  headers: string[];
  children: ReactNode;
  emptyState: ReactNode;
  loading: boolean;
  loadingColumnCount: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-primary/10">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-b border-primary/10 hover:bg-transparent">
            {headers.map((header) => (
              <TableHead key={header} className="font-medium">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingRows columnCount={loadingColumnCount} />
          ) : (
            children || emptyState
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TableLoadingRows({ columnCount }: { columnCount: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={`loading-${index}`} className="border-t border-primary/5">
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <td key={`loading-cell-${columnIndex}`} className="px-3 py-3">
              <Skeleton className="h-4 w-full max-w-[220px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmptyStateRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr className="border-t border-primary/5">
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

export function PaginationRow({
  currentPage,
  totalPages,
  totalElements,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
      <p>
        Page {currentPage} of {totalPages} ({totalElements} total)
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={currentPage <= 1} onClick={onPrev}>
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function SaveButton({
  isPending,
  idleLabel,
  pendingLabel,
  disabled: disabledProp,
}: {
  isPending: boolean;
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="submit"
      className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
      disabled={isPending || disabledProp}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
