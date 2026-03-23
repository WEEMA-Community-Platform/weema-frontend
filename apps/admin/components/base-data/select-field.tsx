"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_SELECTED_VALUE = "__WEEMA_NONE__";

/** Use in filter dropdowns for "All …" options. Radix Select forbids `value=""` on items. */
export const SELECT_FILTER_ALL = "__weema_all__";

export function filterQueryParam(value: string): string | undefined {
  if (!value || value === SELECT_FILTER_ALL) return undefined;
  return value;
}

type SelectOption = {
  value: string;
  label: string;
};

export function SelectField({
  value,
  onValueChange,
  options,
  className,
  placeholder,
  id,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder: string;
  /** For pairing with `<Label htmlFor={id}>`. */
  id?: string;
  disabled?: boolean;
}) {
  const selectValue = value || NONE_SELECTED_VALUE;

  return (
    <Select
      value={selectValue}
      disabled={disabled}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === NONE_SELECTED_VALUE ? "" : nextValue)
      }
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_SELECTED_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
