import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveySettingsForm } from "@/components/survey/survey-settings-form";
import { QuestionCardsBoard } from "@/components/survey/builder/question-cards-board";
import { QuestionEditor } from "@/components/survey/builder/question-editor";
import { SectionSkipConditionsEditor } from "@/components/survey/builder/section-skip-conditions-editor";
import { type EditorMode, type SurveyQuestionWithContext } from "@/components/survey/builder/shared";
import {
  type SectionSkipCondition,
  type SurveySection,
  type SurveyValidationIssue,
} from "@/lib/survey-builder/types";
import type { useSurveyBuilder } from "@/hooks/use-survey-builder";

type Props = {
  editorMode: EditorMode;
  initialSurveyId: string | null;
  isTranslationMode: boolean;
  sections: SurveySection[];
  selectedSection: SurveySection | null;
  selectedQuestion: SurveyQuestionWithContext | null;
  questionByClientId: Map<string, SurveyQuestionWithContext>;
  dependentsMap: Map<string, string[]>;
  issues: SurveyValidationIssue[];
  isSavingAllChanges: boolean;
  savingQuestionClientId: string | null;
  savingSectionClientId: string | null;
  onSelectCardsMode: () => void;
  onDoneDraftQuestion: () => void;
  onSelectQuestion: (questionClientId: string) => void;
  onRequestDeleteQuestion: (sectionClientId: string, questionClientId: string, questionText: string) => void;
  onUpdateSurveyHeader: ReturnType<typeof useSurveyBuilder>["setHeaderField"];
  onSaveSurvey: () => Promise<void>;
  onSaveQuestion: (sectionClientId: string, questionClientId: string) => Promise<void>;
  onUpdateQuestion: ReturnType<typeof useSurveyBuilder>["updateQuestion"];
  onSetQuestionType: ReturnType<typeof useSurveyBuilder>["setQuestionType"];
  onAddOption: ReturnType<typeof useSurveyBuilder>["addOption"];
  onUpdateOption: ReturnType<typeof useSurveyBuilder>["updateOption"];
  onDeleteOption: ReturnType<typeof useSurveyBuilder>["deleteOption"];
  onSetQuestionConfig: ReturnType<typeof useSurveyBuilder>["setQuestionConfig"];
  onAddFollowUpQuestion: () => void;
  onAddNestedFollowUpQuestion: () => void;
  onAddCondition: () => void;
  onUpdateCondition: ReturnType<typeof useSurveyBuilder>["updateCondition"];
  onDeleteCondition: ReturnType<typeof useSurveyBuilder>["deleteCondition"];
  onAddSectionSkipCondition: (sectionClientId: string) => void;
  onUpdateSectionSkipCondition: (
    sectionClientId: string,
    conditionIndex: number,
    updater: (condition: SectionSkipCondition) => SectionSkipCondition
  ) => void;
  onDeleteSectionSkipCondition: (sectionClientId: string, conditionIndex: number) => void;
  surveyTitle: string;
  surveyDescription: string;
  surveyTargetType: string;
  surveyLanguage: "en" | "am";
};

export function SurveyBuilderMainPanel({
  editorMode,
  initialSurveyId,
  isTranslationMode,
  sections,
  selectedSection,
  selectedQuestion,
  questionByClientId,
  dependentsMap,
  issues,
  isSavingAllChanges,
  savingQuestionClientId,
  savingSectionClientId,
  onSelectCardsMode,
  onDoneDraftQuestion,
  onSelectQuestion,
  onRequestDeleteQuestion,
  onUpdateSurveyHeader,
  onSaveSurvey,
  onSaveQuestion,
  onUpdateQuestion,
  onSetQuestionType,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onSetQuestionConfig,
  onAddFollowUpQuestion,
  onAddNestedFollowUpQuestion,
  onAddCondition,
  onUpdateCondition,
  onDeleteCondition,
  onAddSectionSkipCondition,
  onUpdateSectionSkipCondition,
  onDeleteSectionSkipCondition,
  surveyTitle,
  surveyDescription,
  surveyTargetType,
  surveyLanguage,
}: Props) {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto border-r border-primary/10 p-6">
      {editorMode === "settings" ? (
        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle>Survey settings</CardTitle>
          </CardHeader>
          <CardContent>
            <SurveySettingsForm
              title={surveyTitle}
              description={surveyDescription}
              targetType={surveyTargetType}
              language={surveyLanguage}
              onTitleChange={(v) => onUpdateSurveyHeader("title", v)}
              onDescriptionChange={(v) => onUpdateSurveyHeader("description", v)}
              onTargetTypeChange={(v) => onUpdateSurveyHeader("targetType", v)}
              onLanguageChange={(v) => onUpdateSurveyHeader("language", v)}
              lockTargetType={isTranslationMode}
              lockLanguage={isTranslationMode}
              isTranslationMode={isTranslationMode}
              showSaveAction={Boolean(initialSurveyId)}
              onSave={() => void onSaveSurvey()}
              isSaving={false}
              isSaveDisabled={isSavingAllChanges}
            />
          </CardContent>
        </Card>
      ) : editorMode === "cards" ? (
        <div className="space-y-4">
          {selectedSection ? (
            <SectionSkipConditionsEditor
              sections={sections}
              section={selectedSection}
              questionByClientId={questionByClientId}
              onAddCondition={() => onAddSectionSkipCondition(selectedSection.clientId)}
              onUpdateCondition={(conditionIndex, updater) =>
                onUpdateSectionSkipCondition(selectedSection.clientId, conditionIndex, updater)
              }
              onDeleteCondition={(conditionIndex) =>
                onDeleteSectionSkipCondition(selectedSection.clientId, conditionIndex)
              }
            />
          ) : null}
          <QuestionCardsBoard
            section={selectedSection}
            questionByClientId={questionByClientId}
            dependentsMap={dependentsMap}
            onOpen={onSelectQuestion}
            onDelete={(questionClientId) => {
              if (!selectedSection) return;
              const q = selectedSection.questions.find((question) => question.clientId === questionClientId);
              onRequestDeleteQuestion(
                selectedSection.clientId,
                questionClientId,
                q?.questionText || "Untitled question"
              );
            }}
          />
        </div>
      ) : selectedSection && selectedQuestion ? (
        <QuestionEditor
          question={selectedQuestion}
          section={selectedSection}
          questionByClientId={questionByClientId}
          dependentsMap={dependentsMap}
          isTranslationMode={isTranslationMode}
          onBackToCards={onSelectCardsMode}
          backToCardsLabel={initialSurveyId ? "Back to cards" : "Back to questions"}
          onPrimaryAction={() => {
            if (!initialSurveyId) {
              onDoneDraftQuestion();
              return;
            }
            void onSaveQuestion(selectedSection.clientId, selectedQuestion.clientId);
          }}
          primaryActionLabel={
            initialSurveyId
              ? selectedSection.id
                ? "Save question"
                : "Save section & question"
              : "Done"
          }
          primaryActionVariant={initialSurveyId ? "default" : "outline"}
          isPrimaryActionPending={
            initialSurveyId
              ? savingQuestionClientId === selectedQuestion.clientId ||
                savingSectionClientId === selectedSection.clientId ||
                isSavingAllChanges
              : false
          }
          isPrimaryActionDisabled={initialSurveyId ? isSavingAllChanges : false}
          onUpdate={(patch) =>
            onUpdateQuestion(selectedSection.clientId, selectedQuestion.clientId, (prev) => ({
              ...prev,
              ...patch,
            }))
          }
          onTypeChange={(nextType) =>
            onSetQuestionType(selectedSection.clientId, selectedQuestion.clientId, nextType)
          }
          onDelete={() =>
            onRequestDeleteQuestion(
              selectedSection.clientId,
              selectedQuestion.clientId,
              selectedQuestion.questionText || "Untitled question"
            )
          }
          onAddOption={() => onAddOption(selectedSection.clientId, selectedQuestion.clientId)}
          onUpdateOption={(optionClientId, patch) =>
            onUpdateOption(selectedSection.clientId, selectedQuestion.clientId, optionClientId, patch)
          }
          onDeleteOption={(optionClientId) =>
            onDeleteOption(selectedSection.clientId, selectedQuestion.clientId, optionClientId)
          }
          onQuestionConfigChange={(config) =>
            onSetQuestionConfig(selectedSection.clientId, selectedQuestion.clientId, config)
          }
          onAddFollowUpQuestion={onAddFollowUpQuestion}
          onAddNestedFollowUpQuestion={onAddNestedFollowUpQuestion}
          onAddCondition={onAddCondition}
          onUpdateCondition={(idx, updater) =>
            onUpdateCondition(selectedSection.clientId, selectedQuestion.clientId, idx, updater)
          }
          onDeleteCondition={(idx) =>
            onDeleteCondition(selectedSection.clientId, selectedQuestion.clientId, idx)
          }
        />
      ) : null}

      {issues.length > 0 ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <p className="font-medium">Resolve these issues before saving:</p>
          <ul className="mt-1 list-disc pl-5">
            {issues.slice(0, 8).map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
