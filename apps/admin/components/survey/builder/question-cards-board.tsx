"use client";

import type { ReactNode } from "react";

import type { SurveyQuestion, SurveySection } from "@/lib/survey-builder/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { describeCondition, getFollowUpDepth, getQuestionParentId, getQuestionText } from "./shared";

export function QuestionCardsBoard(props: {
  section: SurveySection | null;
  questionByClientId: Map<string, SurveyQuestion>;
  dependentsMap: Map<string, string[]>;
  onOpen: (questionClientId: string) => void;
  onDelete: (questionClientId: string) => void;
}) {
  if (!props.section) {
    return (
      <Card className="border-primary/15">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Create or select a section to start adding questions.
        </CardContent>
      </Card>
    );
  }

  const sectionQuestionIds = new Set(props.section.questions.map((item) => item.clientId));
  const rootQuestions = props.section.questions.filter(
    (question) => !getQuestionParentId(question, sectionQuestionIds)
  );
  const renderDependentNode = (questionClientId: string): ReactNode => {
    const question = props.questionByClientId.get(questionClientId);
    if (!question) return null;
    const nestedDependents = props.dependentsMap.get(questionClientId) ?? [];
    const followUpDepth = getFollowUpDepth(questionClientId, props.questionByClientId, sectionQuestionIds);
    const followUpLabel =
      followUpDepth >= 2 ? `Nested follow-up (L${followUpDepth})` : "Follow-up";

    return (
      <li key={questionClientId} className="space-y-1 wrap-break-word whitespace-normal">
        <span>
          - {followUpLabel}: {getQuestionText(question)}
        </span>
        {nestedDependents.length > 0 ? (
          <ul className="space-y-1 pl-3">
            {nestedDependents.map((nestedId) => renderDependentNode(nestedId))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{props.section.title || "Untitled section"}</h2>
        <p className="text-sm text-muted-foreground">Card view: open a question to edit details.</p>
      </div>
      {rootQuestions.map((question, index) => {
        const dependentIds = props.dependentsMap.get(question.clientId) ?? [];
        return (
          <Card
            key={question.clientId}
            className="cursor-pointer border-primary/15 transition-colors hover:border-orange-300 hover:bg-orange-500/8 dark:hover:border-orange-400/50 dark:hover:bg-orange-500/10"
            onClick={() => props.onOpen(question.clientId)}
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Question {index + 1}</p>
                  <p className="font-medium wrap-break-word whitespace-normal">
                    {question.questionText || "Untitled question"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {question.questionType} · {question.required ? "Required" : "Optional"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onOpen(question.clientId);
                    }}
                  >
                    Open
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onDelete(question.clientId);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {question.showConditions.length > 0 ? (
                <div className="rounded-md border border-primary/10 bg-primary/5 p-2 text-xs">
                  <p className="mb-1 font-medium">This appears when:</p>
                  <ul className="space-y-1">
                    {question.showConditions.map((condition, conditionIndex) => (
                      <li
                        key={`${question.clientId}-condition-${conditionIndex}`}
                        className="wrap-break-word whitespace-normal"
                      >
                        - {describeCondition(condition, props.questionByClientId)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {dependentIds.length > 0 ? (
                <div className="rounded-md border border-primary/10 p-2 text-xs">
                  <p className="mb-1 font-medium">Follow-up questions triggered by this question:</p>
                  <ul className="space-y-1">
                    {dependentIds.map((dependentId) => renderDependentNode(dependentId))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
      {props.section.questions.length === 0 ? (
        <Card className="border-primary/15">
          <CardContent className="p-4 text-sm text-muted-foreground">
            No questions in this section yet.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
