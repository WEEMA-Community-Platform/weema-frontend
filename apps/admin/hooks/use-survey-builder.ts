"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  JsonQuestionConfig,
  ShowCondition,
  SurveyBuilderState,
  SurveyOption,
  SurveyQuestion,
  SurveySection,
} from "@/lib/survey-builder/types";
import {
  applyOrderNo,
  createEmptyOption,
  createEmptyQuestion,
  createEmptySection,
  normalizeQuestionForType,
  reorderList,
} from "@/lib/survey-builder/utils";

function updateSectionQuestions(
  sections: SurveySection[],
  sectionClientId: string,
  updater: (questions: SurveyQuestion[]) => SurveyQuestion[]
) {
  return sections.map((section) => {
    if (section.clientId !== sectionClientId) return section;
    return {
      ...section,
      questions: applyOrderNo(updater(section.questions)),
    };
  });
}

export function useAddQuestion(setState: React.Dispatch<React.SetStateAction<SurveyBuilderState>>) {
  return useCallback(
    (sectionClientId: string) => {
      const nextQuestion = createEmptyQuestion();
      setState((prev) => ({
        ...prev,
        sections: updateSectionQuestions(prev.sections, sectionClientId, (questions) => [
          ...questions,
          { ...nextQuestion, orderNo: questions.length + 1 },
        ]),
      }));
      return nextQuestion.clientId;
    },
    [setState]
  );
}

export function useUpdateQuestion(
  setState: React.Dispatch<React.SetStateAction<SurveyBuilderState>>
) {
  return useCallback(
    (
      sectionClientId: string,
      questionClientId: string,
      updater: (question: SurveyQuestion) => SurveyQuestion
    ) => {
      setState((prev) => ({
        ...prev,
        sections: updateSectionQuestions(prev.sections, sectionClientId, (questions) =>
          questions.map((question) =>
            question.clientId === questionClientId ? updater(question) : question
          )
        ),
      }));
    },
    [setState]
  );
}

export function useDeleteQuestion(
  setState: React.Dispatch<React.SetStateAction<SurveyBuilderState>>
) {
  return useCallback(
    (sectionClientId: string, questionClientId: string) => {
      setState((prev) => {
        const allQuestions = prev.sections.flatMap((section) => section.questions);
        const nextSections = updateSectionQuestions(prev.sections, sectionClientId, (questions) =>
          questions.filter((question) => question.clientId !== questionClientId)
        );
        const remainingQuestionIds = new Set(
          nextSections.flatMap((section) => section.questions.map((question) => question.clientId))
        );
        const removedQuestion = allQuestions.find((question) => question.clientId === questionClientId);
        const removedOptionIds = new Set((removedQuestion?.options ?? []).map((option) => option.clientId));

        return {
          ...prev,
          sections: nextSections.map((section) => ({
            ...section,
            questions: section.questions.map((question) => ({
              ...question,
              showConditions: question.showConditions.filter((condition) => {
                if (!remainingQuestionIds.has(condition.parentQuestionClientId)) return false;
                if (condition.optionClientId && removedOptionIds.has(condition.optionClientId)) return false;
                return true;
              }),
            })),
          })),
        };
      });
    },
    [setState]
  );
}

export function useReorderQuestions(
  setState: React.Dispatch<React.SetStateAction<SurveyBuilderState>>
) {
  return useCallback(
    (sectionClientId: string, fromIndex: number, toIndex: number) => {
      setState((prev) => ({
        ...prev,
        sections: updateSectionQuestions(prev.sections, sectionClientId, (questions) =>
          reorderList(questions, fromIndex, toIndex)
        ),
      }));
    },
    [setState]
  );
}

export function useManageConditions(
  setState: React.Dispatch<React.SetStateAction<SurveyBuilderState>>
) {
  const addCondition = useCallback(
    (sectionClientId: string, questionClientId: string, condition: ShowCondition) => {
      setState((prev) => ({
        ...prev,
        sections: updateSectionQuestions(prev.sections, sectionClientId, (questions) =>
          questions.map((question) =>
            question.clientId === questionClientId
              ? { ...question, showConditions: [...question.showConditions, condition] }
              : question
          )
        ),
      }));
    },
    [setState]
  );

  const updateCondition = useCallback(
    (
      sectionClientId: string,
      questionClientId: string,
      conditionIndex: number,
      updater: (condition: ShowCondition) => ShowCondition
    ) => {
      setState((prev) => ({
        ...prev,
        sections: updateSectionQuestions(prev.sections, sectionClientId, (questions) =>
          questions.map((question) => {
            if (question.clientId !== questionClientId) return question;
            return {
              ...question,
              showConditions: question.showConditions.map((condition, index) =>
                index === conditionIndex ? updater(condition) : condition
              ),
            };
          })
        ),
      }));
    },
    [setState]
  );

  const deleteCondition = useCallback(
    (sectionClientId: string, questionClientId: string, conditionIndex: number) => {
      setState((prev) => ({
        ...prev,
        sections: updateSectionQuestions(prev.sections, sectionClientId, (questions) =>
          questions.map((question) =>
            question.clientId === questionClientId
              ? {
                  ...question,
                  showConditions: question.showConditions
                    .filter((_, index) => index !== conditionIndex)
                    .map((condition, index) =>
                      index === 0 ? { ...condition, logicType: "AND" } : condition
                    ),
                }
              : question
          )
        ),
      }));
    },
    [setState]
  );

  return { addCondition, updateCondition, deleteCondition };
}

export function useSurveyBuilder(initialState: SurveyBuilderState) {
  const [state, setState] = useState<SurveyBuilderState>(initialState);

  const setHeaderField = useCallback(
    <K extends keyof SurveyBuilderState>(key: K, value: SurveyBuilderState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addSection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection(prev.sections.length + 1)],
    }));
  }, []);

  const updateSection = useCallback((sectionClientId: string, patch: Partial<SurveySection>) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.clientId === sectionClientId ? { ...section, ...patch } : section
      ),
    }));
  }, []);

  const deleteSection = useCallback((sectionClientId: string) => {
    setState((prev) => {
      const nextSections = prev.sections.filter((section) => section.clientId !== sectionClientId);
      return {
        ...prev,
        sections: applyOrderNo(nextSections.length ? nextSections : [createEmptySection(1)]),
      };
    });
  }, []);

  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => ({
      ...prev,
      sections: applyOrderNo(reorderList(prev.sections, fromIndex, toIndex)),
    }));
  }, []);

  const addQuestion = useAddQuestion(setState);
  const updateQuestion = useUpdateQuestion(setState);
  const deleteQuestion = useDeleteQuestion(setState);
  const reorderQuestions = useReorderQuestions(setState);
  const { addCondition, updateCondition, deleteCondition } = useManageConditions(setState);

  const setQuestionType = useCallback(
    (sectionClientId: string, questionClientId: string, nextType: SurveyQuestion["questionType"]) => {
      updateQuestion(sectionClientId, questionClientId, (question) =>
        normalizeQuestionForType(question, nextType)
      );
    },
    [updateQuestion]
  );

  const addOption = useCallback(
    (sectionClientId: string, questionClientId: string) => {
      updateQuestion(sectionClientId, questionClientId, (question) => ({
        ...question,
        options: [...question.options, createEmptyOption(question.options.length + 1)],
      }));
    },
    [updateQuestion]
  );

  const updateOption = useCallback(
    (
      sectionClientId: string,
      questionClientId: string,
      optionClientId: string,
      patch: Partial<SurveyOption>
    ) => {
      updateQuestion(sectionClientId, questionClientId, (question) => ({
        ...question,
        options: question.options.map((option) =>
          option.clientId === optionClientId ? { ...option, ...patch } : option
        ),
      }));
    },
    [updateQuestion]
  );

  const deleteOption = useCallback(
    (sectionClientId: string, questionClientId: string, optionClientId: string) => {
      updateQuestion(sectionClientId, questionClientId, (question) => ({
        ...question,
        options: applyOrderNo(question.options.filter((option) => option.clientId !== optionClientId)),
        showConditions: question.showConditions.filter(
          (condition) => condition.optionClientId !== optionClientId
        ),
      }));
    },
    [updateQuestion]
  );

  const setQuestionConfig = useCallback(
    (
      sectionClientId: string,
      questionClientId: string,
      questionConfig: JsonQuestionConfig | undefined
    ) => {
      updateQuestion(sectionClientId, questionClientId, (question) => ({
        ...question,
        questionConfig,
      }));
    },
    [updateQuestion]
  );

  const api = useMemo(
    () => ({
      state,
      setState,
      setHeaderField,
      addSection,
      updateSection,
      deleteSection,
      moveSection,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      reorderQuestions,
      setQuestionType,
      addOption,
      updateOption,
      deleteOption,
      setQuestionConfig,
      addCondition,
      updateCondition,
      deleteCondition,
    }),
    [
      state,
      setHeaderField,
      addSection,
      updateSection,
      deleteSection,
      moveSection,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      reorderQuestions,
      setQuestionType,
      addOption,
      updateOption,
      deleteOption,
      setQuestionConfig,
      addCondition,
      updateCondition,
      deleteCondition,
    ]
  );

  return api;
}
