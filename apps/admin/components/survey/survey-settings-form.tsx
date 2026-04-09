"use client";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formTextareaClass, inputClass } from "@/components/base-data/shared";
import { TARGET_TYPES } from "@/lib/survey-builder/utils";

type SurveySettingsFormProps = {
  title: string;
  description: string;
  targetType: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTargetTypeChange: (value: string) => void;
  showSaveAction?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  isSaveDisabled?: boolean;
};

export function SurveySettingsForm(props: SurveySettingsFormProps) {
  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel>Survey title</FieldLabel>
        <Input
          value={props.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          placeholder="Enter survey title"
          className={inputClass}
        />
      </Field>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={props.description}
          onChange={(event) => props.onDescriptionChange(event.target.value)}
          placeholder="Describe survey purpose and audience"
          className={formTextareaClass}
        />
      </Field>
      <Field>
        <FieldLabel>Target type</FieldLabel>
        <Select value={props.targetType} onValueChange={props.onTargetTypeChange}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder="Select target type" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_TYPES.map((targetType) => (
              <SelectItem key={targetType.value} value={targetType.value}>
                {targetType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {props.showSaveAction ? (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={props.onSave}
            disabled={props.isSaveDisabled || props.isSaving}
          >
            {props.isSaving ? "Saving settings..." : "Save settings"}
          </Button>
        </div>
      ) : null}
    </FieldGroup>
  );
}
