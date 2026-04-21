"use client";

import { EyeIcon, LockIcon, MoreVerticalIcon, PencilIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";

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

export function LockedBadge({ locked }: { locked: boolean }) {
  const tCard = useTranslations("community.card");
  if (locked) {
    return (
      <Badge className="gap-1 border-transparent bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">
        <LockIcon className="size-3" />
        {tCard("locked")}
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 border-transparent bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
      <UnlockIcon className="size-3" />
      {tCard("unlocked")}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: EntityStatus }) {
  const tStatus = useTranslations("common.states");
  return (
    <Badge variant={status === "ACTIVE" ? "default" : "secondary"} className="text-[11px] font-medium px-2 py-0.5 shrink-0">
      {status === "ACTIVE" ? tStatus("active") : tStatus("inactive")}
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
  viewActionLabel,
  editActionLabel,
}: {
  title: string;
  status: EntityStatus;
  children: React.ReactNode;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  extraMenuItems?: React.ReactNode;
  showViewAction?: boolean;
  showEditAction?: boolean;
  viewActionLabel?: string;
  editActionLabel?: string;
}) {
  const tActions = useTranslations("common.actions");
  const tCard = useTranslations("community.card");
  const resolvedViewLabel = viewActionLabel ?? tActions("viewDetails");
  const resolvedEditLabel = editActionLabel ?? tActions("edit");
  const hasPrimaryActions = showViewAction || showEditAction;
  return (
    <Card className=" py-0 overflow-hidden transition-colors hover:ring-primary/50">
      <CardHeader className="px-4 pt-4  flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-snug truncate">{title}</h3>
          <StatusBadge status={status} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon" className="-mr-1 shrink-0 text-muted-foreground size-9 min-w-9 min-h-9" aria-label={tCard("openActionsMenu")}>
                <MoreVerticalIcon className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" side="bottom" className="min-w-48">
            {hasPrimaryActions ? (
              <DropdownMenuGroup >
                {showViewAction ? (
                  <DropdownMenuItem className="text-[12px] whitespace-nowrap" onClick={onView}><EyeIcon />{resolvedViewLabel}</DropdownMenuItem>
                ) : null}
                {showEditAction ? (
                  <DropdownMenuItem className="text-[12px] whitespace-nowrap" onClick={onEdit}><PencilIcon />{resolvedEditLabel}</DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            ) : null}
            {extraMenuItems && (
              <>
                {hasPrimaryActions ? <DropdownMenuSeparator /> : null}
                <DropdownMenuGroup>{extraMenuItems}</DropdownMenuGroup>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-[12px] whitespace-nowrap" variant="destructive" onClick={onDelete}><Trash2Icon />{tActions("delete")}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
