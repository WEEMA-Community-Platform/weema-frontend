"use client";

import { descriptionCellClass } from "@/components/base-data/shared";
import { TableCell } from "@/components/ui/table";

export function DescriptionTableCell({
  description,
}: {
  description: string | null | undefined;
}) {
  const text = description?.trim() ?? "";

  return (
    <TableCell className="align-top">
      <p className={descriptionCellClass}>{text || "—"}</p>
    </TableCell>
  );
}
