"use client";

import { useTranslations } from "next-intl";

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
import { SURVEY_LANGUAGES, TARGET_TYPES } from "@/lib/survey-builder/utils";

type SurveySettingsFormProps = {
  title: string;
  description: string;
  targetType: string;
  language: "en" | "am";
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTargetTypeChange: (value: string) => void;
  onLanguageChange: (value: "en" | "am") => void;
  lockTargetType?: boolean;
  lockLanguage?: boolean;
  isTranslationMode?: boolean;
  showSaveAction?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  isSaveDisabled?: boolean;
};

export function SurveySettingsForm(props: SurveySettingsFormProps) {
  const t = useTranslations("survey.settings");
  const tTargetType = useTranslations("survey.settings.targetType");
  const tLanguage = useTranslations("survey.settings.language");

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel>{t("titleLabel")}</FieldLabel>
        <Input
          value={props.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          placeholder={t("titlePlaceholder")}
          className={inputClass}
        />
      </Field>
      <Field>
        <FieldLabel>{t("descriptionLabel")}</FieldLabel>
        <textarea
          value={props.description}
          onChange={(event) => props.onDescriptionChange(event.target.value)}
          placeholder={t("descriptionPlaceholder")}
          className={formTextareaClass}
        />
      </Field>
      <Field>
        <FieldLabel>{t("targetTypeLabel")}</FieldLabel>
        <Select
          value={props.targetType}
          onValueChange={props.onTargetTypeChange}
          disabled={props.lockTargetType}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={t("targetTypePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {TARGET_TYPES.map((targetType) => (
              <SelectItem key={targetType.value} value={targetType.value}>
                {tTargetType(
                  targetType.value as
                    | "MEMBER"
                    | "SELF_HELP_GROUP"
                    | "CLUSTER"
                    | "FEDERATION"
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>{t("languageLabel")}</FieldLabel>
        <Select
          value={props.language}
          onValueChange={(value) => props.onLanguageChange(value as "en" | "am")}
          disabled={props.lockLanguage}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={t("languagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {SURVEY_LANGUAGES.map((language) => (
              <SelectItem key={language.value} value={language.value}>
                {tLanguage(language.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {props.isTranslationMode ? (
          <p className="text-xs text-muted-foreground">{t("translationHint")}</p>
        ) : null}
      </Field>
      {props.showSaveAction ? (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={props.onSave}
            disabled={props.isSaveDisabled || props.isSaving}
          >
            {props.isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      ) : null}
    </FieldGroup>
  );
}
