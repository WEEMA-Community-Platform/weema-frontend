import type { ReactNode } from "react";

export function MemberDetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-3 sm:grid-cols-[minmax(0,8.75rem)_1fr] sm:gap-x-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium wrap-break-word text-foreground">
        {value ?? <span className="text-muted-foreground/60">—</span>}
      </div>
    </div>
  );
}
