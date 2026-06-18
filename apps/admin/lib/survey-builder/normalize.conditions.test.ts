import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSurveyResponse,
  serializeSurveyPayload,
  type BackendSurveyRecord,
} from "@/lib/survey-builder/normalize";
import { serializeQuestionPayload } from "@/lib/api/surveys/serializers";
import type { SurveyBuilderState } from "@/lib/survey-builder/types";

test("serializeSurveyPayload keeps all mixed-parent follow-up conditions", () => {
  const state: SurveyBuilderState = {
    title: "Composite follow-up test",
    description: "",
    targetType: "MEMBER",
    language: "en",
    isTranslation: false,
    sections: [
      {
        clientId: "section-1",
        title: "Section 1",
        description: "",
        orderNo: 1,
        skipConditions: [],
        questions: [
          {
            clientId: "q1",
            questionText: "Q1",
            questionType: "SHORT_TEXT",
            required: false,
            orderNo: 1,
            options: [],
            showConditions: [],
          },
          {
            clientId: "q2",
            questionText: "Q2",
            questionType: "SHORT_TEXT",
            required: false,
            orderNo: 2,
            options: [],
            showConditions: [],
          },
          {
            clientId: "q3",
            questionText: "Q3",
            questionType: "SINGLE_CHOICE",
            required: false,
            orderNo: 3,
            options: [
              { clientId: "q3-o1", text: "Yes", value: "", orderNo: 1 },
              { clientId: "q3-o2", text: "No", value: "", orderNo: 2 },
            ],
            showConditions: [],
          },
          {
            clientId: "q4",
            questionText: "Follow-up",
            questionType: "LONG_TEXT",
            required: false,
            orderNo: 4,
            options: [],
            showConditions: [
              {
                parentQuestionClientId: "q1",
                operator: "CONTAINS",
                expectedValue: "x",
                logicType: "AND",
              },
              {
                parentQuestionClientId: "q2",
                operator: "NOT_EQUALS",
                expectedValue: "y",
                logicType: "AND",
              },
              {
                parentQuestionClientId: "q3",
                operator: "EQUALS",
                optionClientId: "q3-o1",
                logicType: "OR",
              },
            ],
          },
        ],
      },
    ],
  };

  const payload = serializeSurveyPayload(state);
  const followUp = payload.sections[0]?.questions[3];
  assert.ok(followUp?.showConditions);
  assert.equal(followUp.showConditions.length, 3);
  assert.deepEqual(
    followUp.showConditions.map((condition) => ({
      parentQuestionClientId: condition.parentQuestionClientId,
      operator: condition.operator,
      optionClientId: condition.optionClientId,
      expectedValue: condition.expectedValue,
      logicType: condition.logicType,
    })),
    [
      {
        parentQuestionClientId: "q1",
        operator: "CONTAINS",
        optionClientId: undefined,
        expectedValue: "x",
        logicType: "AND",
      },
      {
        parentQuestionClientId: "q2",
        operator: "NOT_EQUALS",
        optionClientId: undefined,
        expectedValue: "y",
        logicType: "AND",
      },
      {
        parentQuestionClientId: "q3",
        operator: "EQUALS",
        optionClientId: "q3-o1",
        expectedValue: undefined,
        logicType: "OR",
      },
    ]
  );
});

test("normalizeSurveyResponse repairs legacy boolean CONTAINS follow-up operators", () => {
  const backendRecord: BackendSurveyRecord = {
    id: "survey-1",
    title: "Survey",
    targetType: "MEMBER",
    language: "en",
    sections: [
      {
        id: "section-1",
        clientId: "section-client-1",
        title: "Section",
        orderNo: 1,
        questions: [
          {
            id: "parent-id",
            clientId: "parent",
            questionText: "Boolean parent",
            questionType: "BOOLEAN",
            orderNo: 1,
            options: [],
          },
          {
            id: "follow-up-id",
            clientId: "follow-up",
            questionText: "Follow-up",
            questionType: "NUMBER",
            orderNo: 2,
            options: [],
            conditions: [
              {
                parentQuestionId: "parent-id",
                operator: "CONTAINS",
                expectedValue: "true",
                logicType: "AND",
              },
            ],
          },
        ],
      },
    ],
  };

  const normalized = normalizeSurveyResponse(backendRecord);
  const followUp = normalized.sections[0]?.questions.find(
    (question) => question.clientId === "follow-up"
  );

  assert.equal(followUp?.showConditions[0]?.operator, "EQUALS");
  assert.equal(followUp?.showConditions[0]?.expectedValue, "true");
});

test("serializeQuestionPayload sends repaired conditions for update endpoints", () => {
  const parent = {
    id: "parent-id",
    clientId: "parent",
    questionText: "Boolean parent",
    questionType: "BOOLEAN" as const,
    required: true,
    orderNo: 1,
    options: [],
    showConditions: [],
  };
  const followUp = {
    id: "follow-up-id",
    clientId: "follow-up",
    questionText: "Follow-up",
    questionType: "NUMBER" as const,
    required: true,
    orderNo: 2,
    options: [],
    showConditions: [
      {
        parentQuestionClientId: "parent",
        operator: "CONTAINS" as const,
        expectedValue: "true",
        logicType: "AND" as const,
      },
    ],
  };

  const payload = serializeQuestionPayload(followUp, {
    questionIdByClientId: new Map([["parent", "parent-id"]]),
    questionByClientId: new Map([["parent", parent]]),
  });

  assert.equal(payload.showConditions?.[0]?.operator, "EQUALS");
  assert.equal(payload.conditions?.[0]?.operator, "EQUALS");
  assert.equal(payload.conditions?.[0]?.parentQuestionId, "parent-id");
});

test("normalizeSurveyResponse remaps parent and option IDs for multi-parent follow-ups", () => {
  const backendRecord: BackendSurveyRecord = {
    id: "survey-1",
    title: "Survey",
    targetType: "MEMBER",
    language: "en",
    sections: [
      {
        id: "section-1",
        clientId: "section-client-1",
        title: "Section",
        orderNo: 1,
        skipConditions: [],
        questions: [
          {
            id: "question-1-id",
            clientId: "q1",
            questionText: "Q1",
            questionType: "SHORT_TEXT",
            orderNo: 1,
            options: [],
          },
          {
            id: "question-2-id",
            clientId: "q2",
            questionText: "Q2",
            questionType: "SHORT_TEXT",
            orderNo: 2,
            options: [],
          },
          {
            id: "question-3-id",
            clientId: "q3",
            questionText: "Q3",
            questionType: "SINGLE_CHOICE",
            orderNo: 3,
            options: [
              {
                id: "option-yes-id",
                clientId: "q3-o1",
                optionText: "Yes",
                orderNo: 1,
              },
            ],
          },
          {
            id: "question-4-id",
            clientId: "q4",
            questionText: "Follow-up",
            questionType: "LONG_TEXT",
            orderNo: 4,
            showConditions: [
              {
                parentQuestionId: "question-1-id",
                operator: "CONTAINS",
                expectedValue: "x",
                logicType: "AND",
              },
              {
                parentQuestionId: "question-2-id",
                operator: "NOT_EQUALS",
                expectedValue: "y",
                logicType: "AND",
              },
              {
                parentQuestionId: "question-3-id",
                operator: "EQUALS",
                optionId: "option-yes-id",
                logicType: "OR",
              },
            ],
          },
        ],
      },
    ],
  };

  const normalized = normalizeSurveyResponse(backendRecord);
  const followUp = normalized.sections[0]?.questions.find((question) => question.clientId === "q4");
  assert.ok(followUp?.showConditions);
  assert.equal(followUp.showConditions.length, 3);
  assert.deepEqual(
    followUp.showConditions.map((condition) => ({
      parentQuestionClientId: condition.parentQuestionClientId,
      optionClientId: condition.optionClientId,
      expectedValue: condition.expectedValue,
      logicType: condition.logicType,
    })),
    [
      {
        parentQuestionClientId: "q1",
        optionClientId: undefined,
        expectedValue: "x",
        logicType: "AND",
      },
      {
        parentQuestionClientId: "q2",
        optionClientId: undefined,
        expectedValue: "y",
        logicType: "AND",
      },
      {
        parentQuestionClientId: "q3",
        optionClientId: "q3-o1",
        expectedValue: undefined,
        logicType: "OR",
      },
    ]
  );
});
