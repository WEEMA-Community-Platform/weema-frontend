"use client";

import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";

export function DescriptionTableCell({
  description,
  onView,
}: {
  description: string | null | undefined;
  onView: () => void;
}) {
  const text = description?.trim() ?? "";
  const hasContent = text.length > 0;

  return (
    <TableCell className="max-w-[min(100%,20rem)] align-top md:max-w-md lg:max-w-lg">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground wrap-break-word line-clamp-2">
          {hasContent ? text : "—"}
        </p>
        {hasContent && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 self-start px-2.5 text-xs"
            onClick={onView}
          >
            View
          </Button>
        )}
      </div>
    </TableCell>
  );
}
