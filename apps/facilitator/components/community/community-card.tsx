"use client";

import { EyeIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import type { EntityStatus } from "@/lib/api/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function StatusBadge({ status }: { status: EntityStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "default" : "secondary"} className="text-[11px] font-medium px-2 py-0.5 shrink-0">
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </Badge>
  );
}

export function CardMetaRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm min-w-0">
      <Icon className="size-4 shrink-0 mt-0.5 text-muted-foreground/70" aria-hidden />
      <div className="min-w-0 flex-1">
        <span className="text-muted-foreground">{label}:</span>{" "}
        <span className="text-foreground">{children}</span>
      </div>
    </div>
  );
}

export function CommunityCard({
  title,
  status,
  children,
  onView,
  onEdit,
  onDelete,
  extraMenuItems,
  showViewAction = true,
  showEditAction = true,
  showDeleteAction = true,
  viewActionLabel = "View details",
  editActionLabel = "Edit",
}: {
  title: string;
  status: EntityStatus;
  children: React.ReactNode;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  extraMenuItems?: React.ReactNode;
  showViewAction?: boolean;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  viewActionLabel?: string;
  editActionLabel?: string;
}) {
  const hasPrimaryActions = showViewAction || showEditAction;
  const hasAnyMenuContent = hasPrimaryActions || extraMenuItems || showDeleteAction;
  return (
    <Card className="py-0 overflow-hidden ring-1 ring-primary/10 transition-all duration-200 hover:ring-primary/25 hover:shadow-sm hover:shadow-primary/5">
      <CardHeader className="px-4 pt-4 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-snug truncate">{title}</h3>
          <StatusBadge status={status} />
        </div>
        {hasAnyMenuContent ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon" className="-mr-1 shrink-0 text-muted-foreground size-9 min-w-9 min-h-9" aria-label="Open actions menu">
                  <MoreVerticalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" side="bottom" className="min-w-48">
              {hasPrimaryActions ? (
                <DropdownMenuGroup>
                  {showViewAction && onView ? (
                    <DropdownMenuItem className="text-[12px] whitespace-nowrap" onClick={onView}><EyeIcon />{viewActionLabel}</DropdownMenuItem>
                  ) : null}
                  {showEditAction && onEdit ? (
                    <DropdownMenuItem className="text-[12px] whitespace-nowrap" onClick={onEdit}><PencilIcon />{editActionLabel}</DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              ) : null}
              {extraMenuItems && (
                <>
                  {hasPrimaryActions ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuGroup>{extraMenuItems}</DropdownMenuGroup>
                </>
              )}
              {showDeleteAction && onDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="text-[12px] whitespace-nowrap" variant="destructive" onClick={onDelete}><Trash2Icon />Delete</DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-3 border-t border-primary/10 pt-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function CommunityCardSkeleton({ count = 6, rowCount = 2 }: { count?: number; rowCount?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border border-primary/10 py-0 overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-3"><Skeleton className="h-5 w-2/3" /></CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="border-t border-primary/10 pt-3 space-y-3">
              {Array.from({ length: rowCount }).map((_, j) => (
                <Skeleton key={j} className={j === 0 ? "h-4 w-2/3" : j === 1 ? "h-4 w-1/2" : "h-4 w-2/5"} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
