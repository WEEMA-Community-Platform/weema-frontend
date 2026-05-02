"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

export function SubmissionStatusBadge({ status }: { status: string }) {
  const t = useTranslations("survey.submissions.status");
  const normalized = status.toUpperCase();
  if (normalized === "FINISHED" || normalized === "SUBMITTED") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        {t("submitted")}
      </Badge>
    );
  }
  if (normalized === "NOT_STARTED" || normalized === "NOT STARTED") {
    return (
      <Badge className="border-transparent bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
        {t("notStarted")}
      </Badge>
    );
  }
  if (normalized === "IN_PROGRESS" || normalized === "IN PROGRESS") {
    return (
      <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        {t("inProgress")}
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}
