"use client";

import { ChevronLeftIcon, ChevronRightIcon, Loader2, Plus, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const inputClass = "h-11 text-[0.95rem] md:text-base";
/** Read-only fields in view dialogs (matches edit sizing, muted surface). */
export const viewReadOnlyInputClass = `${inputClass} cursor-default bg-muted/30`;
export const viewReadOnlyTextareaClass =
  "min-h-24 w-full cursor-default rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm outline-none";

/**
 * Body for base-data dialog forms. `FieldGroup` already uses flex `gap`; do not add `space-y-*`
 * on the same node — it stacks with gap and makes spacing look uneven.
 */
export const baseDataDialogFieldGroupClass = "gap-4 overflow-auto px-5 pb-4";

/** Editable description in add/edit modals — matches `inputClass` typography and focus treatment. */
export const formTextareaClass =
  "min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-[0.95rem] md:text-base leading-normal outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 dark:bg-input/30";
export const descriptionCellClass =
  "max-w-[34ch] whitespace-normal break-words text-muted-foreground line-clamp-2";

/** Row action buttons — keep horizontal even on small screens. Avoid nested `overflow-x-auto` here: it flashes a scrollbar when focus rings shift layout; the table container already scrolls horizontally when needed. */
export const tableRowActionsClass =
  "flex w-full min-w-0 flex-nowrap items-center justify-start gap-2 whitespace-nowrap";

/** Last column: keep text and controls left-aligned with the Actions header (avoids odd centering). */
export const tableActionsCellClass = "align-top text-left";

/** Empty list copy when the API returns no rows — reflects search vs filters vs empty catalog. */
export function useListEmptyMessage() {
  const t = useTranslations("listEmpty");
  return function listEmptyMessage(opts: {
    entityPlural: string;
    hasSearch: boolean;
    hasFilters: boolean;
    emptyCatalogHint: string;
  }): string {
    const { entityPlural, hasSearch, hasFilters, emptyCatalogHint } = opts;
    if (hasSearch && hasFilters) {
      return t("searchAndFilters", { entity: entityPlural });
    }
    if (hasSearch) {
      return t("searchOnly", { entity: entityPlural });
    }
    if (hasFilters) {
      return t("filtersOnly", { entity: entityPlural });
    }
    return emptyCatalogHint;
  };
}

/**
 * Back-compat helper retained for any remaining callers: returns English copy.
 * Prefer `useListEmptyMessage` in client components for localization.
 */
export function listEmptyMessage(opts: {
  entityPlural: string;
  hasSearch: boolean;
  hasFilters: boolean;
  emptyCatalogHint: string;
}): string {
  const { entityPlural, hasSearch, hasFilters, emptyCatalogHint } = opts;
  if (hasSearch && hasFilters) {
    return `No ${entityPlural} match your search and filters. Try adjusting or clearing them.`;
  }
  if (hasSearch) {
    return `No ${entityPlural} match your search. Try a different term.`;
  }
  if (hasFilters) {
    return `No ${entityPlural} match your filters. Try adjusting or clearing filters.`;
  }
  return emptyCatalogHint;
}

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
  onAdd?: () => void;
  addLabel?: string;
  onOpenFilters?: () => void;
  showFilterButton?: boolean;
  hasActiveFilters?: boolean;
}) {
  const tTable = useTranslations("community.members.table");
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
          {tTable("filters")}
          {hasActiveFilters && (
            <span
              className="ml-0.5 size-1.5 rounded-full bg-primary"
              aria-label={tTable("filtersActiveLabel")}
            />
          )}
        </Button>
      )}
      {onAdd && (
        <Button
          type="button"
          className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

export function TableShell({
  headers,
  children,
  emptyState,
  loading,
  loadingColumnCount,
  isError = false,
  errorMessage,
  onRetry,
  variant = "default",
}: {
  headers: string[];
  children: ReactNode;
  emptyState: ReactNode;
  loading: boolean;
  loadingColumnCount: number;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  /** `embedded`: full-width inside a `Card` — avoids double borders / corner mismatch with nested `rounded-lg` boxes. */
  variant?: "default" | "embedded";
}) {
  const shellClass =
    variant === "embedded"
      ? "overflow-hidden rounded-b-xl"
      : "overflow-hidden rounded-lg border border-primary/10";

  return (
    <div className={shellClass}>
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="border-b border-primary/10 hover:bg-transparent">
            {headers.map((header, index) => (
              <TableHead key={`${header}-${index}`}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingRows columnCount={loadingColumnCount} />
          ) : isError ? (
            <QueryErrorRow colSpan={headers.length} message={errorMessage} onRetry={onRetry} />
          ) : Children.count(children) === 0 ? (
            emptyState
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function QueryErrorRow({
  colSpan,
  message,
  onRetry,
}: {
  colSpan: number;
  message?: string;
  onRetry?: () => void;
}) {
  const tEmpty = useTranslations("common.empty");
  const tActions = useTranslations("common.actions");
  return (
    <tr className="border-t border-primary/5">
      <td colSpan={colSpan} className="px-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {message ?? tEmpty("failedToLoad")}
        </p>
        {onRetry && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={onRetry}
          >
            {tActions("retry")}
          </Button>
        )}
      </td>
    </tr>
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
  const tPage = useTranslations("common.pagination");
  const tActions = useTranslations("common.actions");
  const resultLabel =
    totalElements === 1 ? tPage("resultOne") : tPage("resultOther");
  return (
    <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-xs text-muted-foreground">
      <p>
        {tPage("page")} {currentPage} {tPage("of")} {totalPages}
        <span className="mx-1.5 opacity-40">·</span>
        {totalElements} {resultLabel}
      </p>
      <div className="flex gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={onPrev}
          className="gap-1 pl-2.5"
        >
          <ChevronLeftIcon className="size-3.5" />
          {tActions("previous")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={onNext}
          className="gap-1 pr-2.5"
        >
          {tActions("next")}
          <ChevronRightIcon className="size-3.5" />
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
