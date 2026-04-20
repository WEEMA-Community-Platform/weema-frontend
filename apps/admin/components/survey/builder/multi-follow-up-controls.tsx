"use client";

import type { ShowCondition } from "@/lib/survey-builder/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MultiFollowUpControlsProps = {
  selectedCount: number;
  logicType: ShowCondition["logicType"];
  disabled?: boolean;
  onLogicTypeChange: (logicType: ShowCondition["logicType"]) => void;
  onCreate: () => void;
};

export function MultiFollowUpControls(props: MultiFollowUpControlsProps) {
  return (
    <div className="mt-2 space-y-1.5 rounded-md border border-primary/10 bg-primary/5 p-1.5">
      <p className="text-[10px] leading-tight text-muted-foreground">
        Pick 2+ parents, choose AND/OR, then create one shared follow-up.
      </p>
      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-1.5">
        <Select
          value={props.logicType}
          onValueChange={(value) => props.onLogicTypeChange(value as ShowCondition["logicType"])}
          disabled={props.disabled}
        >
          <SelectTrigger className="h-7 w-[88px] min-w-[88px] px-2 text-[10px] [&_svg]:ml-auto [&_svg]:size-3">
            <SelectValue placeholder="Join" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND" className="text-[11px]">
              AND
            </SelectItem>
            <SelectItem value="OR" className="text-[11px]">
              OR
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 min-w-0 px-2 text-[11px]"
          disabled={props.disabled || props.selectedCount < 2}
          onClick={props.onCreate}
        >
          Add multi-follow-up
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Selected: {props.selectedCount}</p>
    </div>
  );
}
