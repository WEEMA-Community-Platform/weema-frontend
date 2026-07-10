"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  baseDataDialogFieldGroupClass,
  inputClass,
} from "@/components/base-data/shared";
import { SelectField } from "@/components/base-data/select-field";
import { SegmentedControl } from "@/components/analytics/segmented-control";
import { useWoredasQuery, useKebelesQuery } from "@/hooks/use-base-data";
import { useUsersQuery } from "@/hooks/use-users-admin";
import type {
  AnalyticsGranularity,
  EntityStatus,
} from "@/lib/api/analytics";

const FACILITATOR_ROLE = "ROLE_FACILITATOR";
const LIST_PAGE_SIZE = 300;

export type AnalyticsFilters = {
  woredaId: string;
  kebeleId: string;
  facilitatorId: string;
  status: "" | EntityStatus;
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
  cumulative: boolean;
};

export const EMPTY_FILTERS: AnalyticsFilters = {
  woredaId: "",
  kebeleId: "",
  facilitatorId: "",
  status: "",
  from: "",
  to: "",
  granularity: "MONTH",
  cumulative: false,
};

/** True when any location/status/date filter is active (granularity/cumulative are view options, not filters). */
export function hasActiveFilters(f: AnalyticsFilters): boolean {
  return (
    !!f.woredaId ||
    !!f.kebeleId ||
    !!f.facilitatorId ||
    !!f.status ||
    !!f.from ||
    !!f.to
  );
}

export function AnalyticsFilterDialog({
  open,
  onOpenChange,
  filters,
  onApply,
  showFacilitator,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AnalyticsFilters;
  onApply: (next: AnalyticsFilters) => void;
  showFacilitator: boolean;
}) {
  const t = useTranslations("analytics.filters");
  const tCommon = useTranslations("basedata.common");
  const [draft, setDraft] = useState<AnalyticsFilters>(filters);

  // Re-seed the draft when the dialog transitions to open so it reflects the
  // applied state. Adjusting state during render (React's recommended pattern
  // for "reset on prop change") avoids a setState-in-effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(filters);
  }

  const woredasQuery = useWoredasQuery({ pageSize: LIST_PAGE_SIZE });
  const kebelesQuery = useKebelesQuery({
    pageSize: LIST_PAGE_SIZE,
    woredaId: draft.woredaId || undefined,
  });
  const facilitatorsQuery = useUsersQuery({
    page: 1,
    pageSize: LIST_PAGE_SIZE,
    roles: [FACILITATOR_ROLE],
  });

  const woredaOptions = useMemo(
    () =>
      (woredasQuery.data?.woredas ?? []).map((w) => ({
        value: w.id,
        label: w.name,
      })),
    [woredasQuery.data]
  );
  const kebeleOptions = useMemo(
    () =>
      (kebelesQuery.data?.kebeles ?? []).map((k) => ({
        value: k.id,
        label: k.name,
      })),
    [kebelesQuery.data]
  );
  const facilitatorOptions = useMemo(
    () =>
      (facilitatorsQuery.data?.users ?? []).map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}`.trim(),
      })),
    [facilitatorsQuery.data]
  );

  const statusOptions = [
    { value: "ACTIVE", label: t("statusActive") },
    { value: "INACTIVE", label: t("statusInactive") },
  ];

  const granularityOptions: { value: AnalyticsGranularity; label: string }[] = [
    { value: "DAY", label: t("granularityDay") },
    { value: "MONTH", label: t("granularityMonth") },
    { value: "YEAR", label: t("granularityYear") },
  ];

  const set = <K extends keyof AnalyticsFilters>(
    key: K,
    value: AnalyticsFilters[K]
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <FieldGroup className={baseDataDialogFieldGroupClass}>
          <Field>
            <FieldLabel htmlFor="analytics-filter-woreda">
              {t("woredaLabel")}
            </FieldLabel>
            <SelectField
              id="analytics-filter-woreda"
              value={draft.woredaId}
              placeholder={t("woredaAll")}
              options={woredaOptions}
              onValueChange={(value) =>
                // Changing woreda invalidates a kebele from a different woreda.
                setDraft((prev) => ({ ...prev, woredaId: value, kebeleId: "" }))
              }
              className={inputClass}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="analytics-filter-kebele">
              {t("kebeleLabel")}
            </FieldLabel>
            <SelectField
              id="analytics-filter-kebele"
              value={draft.kebeleId}
              placeholder={t("kebeleAll")}
              options={kebeleOptions}
              onValueChange={(value) => set("kebeleId", value)}
              className={inputClass}
            />
          </Field>

          {showFacilitator ? (
            <Field>
              <FieldLabel htmlFor="analytics-filter-facilitator">
                {t("facilitatorLabel")}
              </FieldLabel>
              <SelectField
                id="analytics-filter-facilitator"
                value={draft.facilitatorId}
                placeholder={t("facilitatorAll")}
                options={facilitatorOptions}
                onValueChange={(value) => set("facilitatorId", value)}
                className={inputClass}
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="analytics-filter-status">
              {t("statusLabel")}
            </FieldLabel>
            <SelectField
              id="analytics-filter-status"
              value={draft.status}
              placeholder={t("statusAll")}
              options={statusOptions}
              onValueChange={(value) =>
                set("status", value as AnalyticsFilters["status"])
              }
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="analytics-filter-from">
                {t("fromLabel")}
              </FieldLabel>
              <Input
                id="analytics-filter-from"
                type="date"
                value={draft.from}
                max={draft.to || undefined}
                onChange={(e) => set("from", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="analytics-filter-to">
                {t("toLabel")}
              </FieldLabel>
              <Input
                id="analytics-filter-to"
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                onChange={(e) => set("to", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>{t("granularityLabel")}</FieldLabel>
            <SegmentedControl
              ariaLabel={t("granularityLabel")}
              value={draft.granularity}
              onChange={(value) => set("granularity", value)}
              options={granularityOptions}
            />
          </Field>

          <Field>
            <FieldLabel>{t("seriesModeLabel")}</FieldLabel>
            <SegmentedControl
              ariaLabel={t("seriesModeLabel")}
              value={draft.cumulative ? "cumulative" : "perPeriod"}
              onChange={(value) => set("cumulative", value === "cumulative")}
              options={[
                { value: "perPeriod", label: t("perPeriod") },
                { value: "cumulative", label: t("cumulative") },
              ]}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => {
              // Preserve current view options (granularity / cumulative) on clear.
              onApply({
                ...EMPTY_FILTERS,
                granularity: draft.granularity,
                cumulative: draft.cumulative,
              });
              onOpenChange(false);
            }}
          >
            {tCommon("clearFilters")}
          </Button>
          <Button
            type="button"
            className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {tCommon("applyFilters")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
