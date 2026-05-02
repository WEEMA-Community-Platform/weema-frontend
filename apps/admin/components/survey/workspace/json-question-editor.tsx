"use client";

import { useMemo } from "react";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

import { formTextareaClass } from "@/components/base-data/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JsonQuestionConfig } from "@/lib/survey-builder/types";

import type { AnswerDraft } from "./types";
import { isRecord, toTitleCase } from "./utils";

function RepeatableEditor({
  value,
  config,
  onChange,
}: {
  value: unknown;
  config?: Extract<JsonQuestionConfig, { jsonType: "REPEATABLE_TABLE" }>;
  onChange: (next: unknown) => void;
}) {
  const t = useTranslations("survey.workspace");
  const rows = useMemo(() => {
    if (!Array.isArray(value)) return [];
    return value.filter((row) => isRecord(row)) as Array<Record<string, unknown>>;
  }, [value]);

  const columnsFromRows = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) keys.add(key);
    }
    return Array.from(keys);
  }, [rows]);

  const safeColumns = config
    ? config.columns.map((column) => column.key || column.label)
    : columnsFromRows.length > 0
      ? columnsFromRows
      : ["value"];

  const updateCell = (rowIndex: number, key: string, nextValue: string) => {
    const nextRows = rows.map((row) => ({ ...row }));
    if (!nextRows[rowIndex]) return;
    nextRows[rowIndex][key] = nextValue;
    onChange(nextRows);
  };

  const addRow = () => {
    const nextRow = safeColumns.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    onChange([...rows, nextRow]);
  };

  const removeRow = (rowIndex: number) => {
    onChange(rows.filter((_, index) => index !== rowIndex));
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {safeColumns.map((column) => (
              <TableHead key={column}>{toTitleCase(column)}</TableHead>
            ))}
            <TableHead className="w-[96px]">{t("row")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={safeColumns.length + 1}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                {t("noRows")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {safeColumns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`} className="whitespace-normal">
                    <Input
                      className="h-9 text-sm"
                      value={String(row[column] ?? "")}
                      onChange={(event) => updateCell(rowIndex, column, event.target.value)}
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 px-2 text-destructive hover:text-destructive"
                    onClick={() => removeRow(rowIndex)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Button type="button" size="sm" variant="outline" onClick={addRow}>
        <PlusIcon className="size-4" />
        {t("addRow")}
      </Button>
    </div>
  );
}

function GridEditor({
  value,
  config,
  onChange,
}: {
  value: unknown;
  config?: Extract<JsonQuestionConfig, { jsonType: "GRID" }>;
  onChange: (next: unknown) => void;
}) {
  const t = useTranslations("survey.workspace");
  const map = isRecord(value) ? (value as Record<string, unknown>) : {};
  const rows = config ? config.rows.map((row) => row.key || row.label) : Object.keys(map);
  const cols = config
    ? config.columns.map((column) => column.key || column.label)
    : (() => {
        const discovered = new Set<string>();
        for (const value of Object.values(map)) {
          if (typeof value === "string" && value.trim()) discovered.add(value);
          if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === "string" && item.trim()) discovered.add(item);
            }
          }
        }
        return discovered.size > 0
          ? Array.from(discovered)
          : ["very_poor", "poor", "fair", "good", "very_good"];
      })();
  const selectionType = config?.selectionType ?? "SINGLE";

  const isSelected = (rowKey: string, colKey: string) => {
    const current = map[rowKey];
    if (selectionType === "MULTIPLE") {
      return Array.isArray(current) && current.includes(colKey);
    }
    return current === colKey;
  };

  const toggleSelection = (rowKey: string, colKey: string) => {
    const current = map[rowKey];
    if (selectionType === "MULTIPLE") {
      const currentArray = Array.isArray(current)
        ? current.filter((item): item is string => typeof item === "string")
        : [];
      const nextArray = currentArray.includes(colKey)
        ? currentArray.filter((item) => item !== colKey)
        : [...currentArray, colKey];
      onChange({ ...map, [rowKey]: nextArray });
      return;
    }
    if (current === colKey) {
      onChange({ ...map, [rowKey]: "" });
      return;
    }
    onChange({ ...map, [rowKey]: colKey });
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>{t("item")}</TableHead>
            {cols.map((col) => (
              <TableHead key={col} className="text-center">
                {toTitleCase(col)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols.length + 1} className="py-6 text-center text-sm text-muted-foreground">
                {t("noGridRows")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row}>
                <TableCell className="font-medium whitespace-normal">{toTitleCase(row)}</TableCell>
                {cols.map((col) => (
                  <TableCell key={`${row}-${col}`} className="text-center">
                    <button
                      type="button"
                      aria-label={t("setRowAsCol", {
                        row: toTitleCase(row),
                        col: toTitleCase(col),
                      })}
                      className={`mx-auto inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1 transition-colors ${
                        isSelected(row, col)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-primary/30 bg-background text-transparent hover:border-primary/60"
                      }`}
                      onClick={() => toggleSelection(row, col)}
                    >
                      <CheckIcon className="size-3.5" />
                    </button>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function JsonQuestionEditor({
  draft,
  questionConfig,
  onDraftChange,
}: {
  draft: AnswerDraft;
  questionConfig?: JsonQuestionConfig;
  onDraftChange: (patch: Partial<AnswerDraft>) => void;
}) {
  const t = useTranslations("survey.workspace");
  const isRepeatable =
    questionConfig?.jsonType === "REPEATABLE_TABLE" ||
    (Array.isArray(draft.jsonValue) &&
      draft.jsonValue.every((entry) => isRecord(entry) || entry === null));
  const isGrid = questionConfig?.jsonType === "GRID" || isRecord(draft.jsonValue);

  if (isRepeatable) {
    return (
      <RepeatableEditor
        value={draft.jsonValue}
        config={questionConfig?.jsonType === "REPEATABLE_TABLE" ? questionConfig : undefined}
        onChange={(next) => onDraftChange({ jsonValue: next })}
      />
    );
  }

  if (isGrid) {
    return (
      <GridEditor
        value={draft.jsonValue}
        config={questionConfig?.jsonType === "GRID" ? questionConfig : undefined}
        onChange={(next) => onDraftChange({ jsonValue: next })}
      />
    );
  }

  return (
    <textarea
      className={`${formTextareaClass} font-mono text-xs`}
      value={draft.jsonValue ? JSON.stringify(draft.jsonValue, null, 2) : ""}
      onChange={(event) => {
        try {
          const parsed = event.target.value.trim() ? JSON.parse(event.target.value) : null;
          onDraftChange({ jsonValue: parsed });
        } catch {
          onDraftChange({ jsonValue: event.target.value });
        }
      }}
      placeholder={t("jsonPlaceholder")}
    />
  );
}
