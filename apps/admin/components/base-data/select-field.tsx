"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_SELECTED_VALUE = "__WEEMA_NONE__";

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
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder: string;
  /** For pairing with `<Label htmlFor={id}>`. */
  id?: string;
}) {
  const selectValue = value || NONE_SELECTED_VALUE;

  return (
    <Select
      value={selectValue}
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
