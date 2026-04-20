import type { CreateSurveyPayload } from "@/lib/survey-builder/normalize";
import { serializeSurveyPayload } from "@/lib/survey-builder/normalize";
import type {
  QuestionType,
  ShowCondition,
  SurveyBuilderState,
  SurveyQuestion,
} from "@/lib/survey-builder/types";
import { isChoiceType } from "@/lib/survey-builder/utils";

export type SurveyQuestionWithContext = SurveyQuestion & {
  sectionClientId: string;
  sectionTitle: string;
};
export type SectionQuestionTree = {
  rootIds: string[];
  childMap: Map<string, string[]>;
  questionById: Map<string, SurveyQuestion>;
};

export const OPERATOR_OPTIONS: Array<{ value: ShowCondition["operator"]; label: string }> = [
  { value: "EQUALS", label: "Equals" },
  { value: "NOT_EQUALS", label: "Does not equal" },
  { value: "GREATER_THAN", label: "Greater than" },
  { value: "LESS_THAN", label: "Less than" },
  { value: "CONTAINS", label: "Contains" },
];

export function getOperatorLabel(operator: ShowCondition["operator"]) {
  return OPERATOR_OPTIONS.find((item) => item.value === operator)?.label ?? operator;
}

export function getOperatorOptionsForQuestionType(questionType: QuestionType) {
  if (questionType === "NUMBER") {
    return OPERATOR_OPTIONS.filter(
      (item) =>
        item.value === "EQUALS" ||
        item.value === "NOT_EQUALS" ||
        item.value === "GREATER_THAN" ||
        item.value === "LESS_THAN"
    );
  }

  if (questionType === "BOOLEAN") {
    return OPERATOR_OPTIONS.filter(
      (item) => item.value === "EQUALS" || item.value === "NOT_EQUALS"
    );
  }

  if (questionType === "SHORT_TEXT" || questionType === "LONG_TEXT") {
    return OPERATOR_OPTIONS.filter(
      (item) =>
        item.value === "EQUALS" || item.value === "NOT_EQUALS" || item.value === "CONTAINS"
    );
  }

  if (questionType === "DATE") {
    return OPERATOR_OPTIONS.filter(
      (item) =>
        item.value === "EQUALS" ||
        item.value === "NOT_EQUALS" ||
        item.value === "GREATER_THAN" ||
        item.value === "LESS_THAN"
    );
  }

  return OPERATOR_OPTIONS.filter(
    (item) => item.value === "EQUALS" || item.value === "NOT_EQUALS"
  );
}

export const LOGIC_TYPE_OPTIONS: Array<{ value: ShowCondition["logicType"]; label: string }> = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];

export function getQuestionText(question: SurveyQuestion | undefined) {
  if (!question) return "Unknown question";
  return question.questionText || "Untitled question";
}

export function describeCondition(
  condition: ShowCondition,
  questionByClientId: Map<string, SurveyQuestion>
) {
  const parent = questionByClientId.get(condition.parentQuestionClientId);
  const option =
    condition.optionClientId && parent
      ? parent.options.find((item) => item.clientId === condition.optionClientId)
      : null;
  const expected = option?.text || condition.expectedValue || "";
  return `${getQuestionText(parent)} ${getOperatorLabel(condition.operator)} ${expected}`.trim();
}

export function getQuestionParentId(question: SurveyQuestion, sectionQuestionIds: Set<string>) {
  return getQuestionParentIds(question, sectionQuestionIds)[0] ?? null;
}

export function getQuestionParentIds(question: SurveyQuestion, sectionQuestionIds: Set<string>) {
  const parentIds: string[] = [];
  const seen = new Set<string>();
  for (const condition of question.showConditions) {
    const parentId = condition.parentQuestionClientId;
    if (!sectionQuestionIds.has(parentId)) continue;
    if (seen.has(parentId)) continue;
    seen.add(parentId);
    parentIds.push(parentId);
  }
  return parentIds;
}

function getPrimaryParentId(question: CreateSurveyPayload["sections"][number]["questions"][number]) {
  return question.showConditions?.[0]?.parentQuestionClientId;
}

export function getFollowUpDepth(
  questionClientId: string,
  questionByClientId: Map<string, SurveyQuestion>,
  sectionQuestionIds: Set<string>
) {
  let depth = 0;
  let current = questionByClientId.get(questionClientId);
  let guard = 0;

  while (current && guard < 100) {
    const parentId = getQuestionParentId(current, sectionQuestionIds);
    if (!parentId) break;
    depth += 1;
    current = questionByClientId.get(parentId);
    guard += 1;
  }

  return depth;
}

// ─── Builder-level types ──────────────────────────────────────────────────────

export type EditorMode = "settings" | "cards" | "question";

export type PendingReorder =
  | { kind: "section"; activeSectionClientId: string; overSectionClientId: string }
  | {
      kind: "question";
      sectionClientId: string;
      activeQuestionClientId: string;
      overQuestionClientId: string;
    };

export type PendingDelete =
  | { kind: "section"; sectionClientId: string; title: string }
  | { kind: "question"; sectionClientId: string; questionClientId: string; questionText: string };

export type SaveAllEligibility = {
  canSaveAll: boolean;
  hasUnsavedChanges: boolean;
  reason: string;
};

// ─── Builder utilities ────────────────────────────────────────────────────────

export function buildBuilderSnapshot(state: SurveyBuilderState): string {
  return JSON.stringify(serializeSurveyPayload(state));
}

export function createFollowUpCondition(parentQuestion: SurveyQuestion): ShowCondition {
  return {
    parentQuestionClientId: parentQuestion.clientId,
    operator: isChoiceType(parentQuestion.questionType) ? "EQUALS" : "CONTAINS",
    optionClientId: isChoiceType(parentQuestion.questionType)
      ? parentQuestion.options[0]?.clientId
      : undefined,
    expectedValue: isChoiceType(parentQuestion.questionType) ? undefined : "",
    logicType: "AND",
  };
}

export function getIdMapsFromState(state: SurveyBuilderState) {
  const questionIdByClientId = new Map<string, string>();
  const optionIdByClientId = new Map<string, string>();
  for (const section of state.sections) {
    for (const question of section.questions) {
      if (question.id) questionIdByClientId.set(question.clientId, question.id);
      for (const option of question.options) {
        if (option.id) optionIdByClientId.set(option.clientId, option.id);
      }
    }
  }
  return { questionIdByClientId, optionIdByClientId };
}

export function getSaveAllEligibility(
  currentSnapshot: string,
  lastSyncedSnapshot: string | null
): SaveAllEligibility {
  if (!lastSyncedSnapshot) {
    return {
      canSaveAll: false,
      hasUnsavedChanges: false,
      reason: "Save all changes is available after the survey is loaded and there are unsaved updates.",
    };
  }
  if (currentSnapshot === lastSyncedSnapshot) {
    return {
      canSaveAll: false,
      hasUnsavedChanges: false,
      reason: "No unsaved changes. Save all is for bulk pending updates.",
    };
  }
  try {
    const current = JSON.parse(currentSnapshot) as CreateSurveyPayload;
    const last = JSON.parse(lastSyncedSnapshot) as CreateSurveyPayload;
    const metadataChanged =
      current.title !== last.title ||
      current.description !== last.description ||
      current.targetType !== last.targetType ||
      current.language !== last.language;
    if (metadataChanged) {
      return {
        canSaveAll: true,
        hasUnsavedChanges: true,
        reason: "Survey metadata changed. Save all will sync title, description, target type, and language.",
      };
    }
    const currentRows = current.sections.flatMap((s, si) =>
      s.questions.map((q) => ({ si, q }))
    );
    const lastRows = last.sections.flatMap((s, si) => s.questions.map((q) => ({ si, q })));
    const currentById = new Map(currentRows.map(({ si, q }) => [q.clientId, { si, q }]));
    const lastById = new Map(lastRows.map(({ si, q }) => [q.clientId, { si, q }]));
    const currentParent = new Map<string, string>();
    const lastParent = new Map<string, string>();
    for (const { q } of currentRows) {
      const p = getPrimaryParentId(q);
      if (p) currentParent.set(q.clientId, p);
    }
    for (const { q } of lastRows) {
      const p = getPrimaryParentId(q);
      if (p) lastParent.set(q.clientId, p);
    }
    const depth = (id: string, map: Map<string, string>) => {
      let d = 0, cur: string | undefined = id, g = 0;
      while (cur && g++ < 100) { const p = map.get(cur); if (!p) break; d++; cur = p; }
      return d;
    };
    let added = 0, changed = 0, nestedTouched = false;
    const changedSections = new Set<number>();
    for (const [id, ce] of currentById) {
      const le = lastById.get(id);
      if (!le) {
        added++;
        changedSections.add(ce.si);
        if (depth(id, currentParent) >= 2) nestedTouched = true;
      } else if (JSON.stringify(ce.q) !== JSON.stringify(le.q)) {
        changed++;
        changedSections.add(ce.si);
        changedSections.add(le.si);
        if (depth(id, currentParent) >= 2 || depth(id, lastParent) >= 2) nestedTouched = true;
      }
    }
    for (const [id, le] of lastById) {
      if (!currentById.has(id)) {
        changed++;
        changedSections.add(le.si);
        if (depth(id, lastParent) >= 2) nestedTouched = true;
      }
    }
    const delta = added + changed;
    const canSaveAll =
      delta >= 2 ||
      (current.sections.length !== last.sections.length && added >= 1) ||
      (changedSections.size >= 2 && delta >= 2) ||
      nestedTouched;
    return {
      canSaveAll,
      hasUnsavedChanges: true,
      reason: canSaveAll
        ? "Save all applies bulk updates across sections/questions, including nested follow-ups."
        : "Use Save all for 2+ unsaved question changes, a new section with questions, or nested follow-up changes.",
    };
  } catch {
    return { canSaveAll: true, hasUnsavedChanges: true, reason: "Save all applies bulk updates." };
  }
}

// ─── Section/question tree ────────────────────────────────────────────────────

export function buildSectionQuestionTree(questions: SurveyQuestion[]): SectionQuestionTree {
  const sectionQuestionIds = new Set(questions.map((item) => item.clientId));
  const childMap = new Map<string, string[]>();
  const rootIds: string[] = [];
  const questionById = new Map(questions.map((item) => [item.clientId, item]));

  for (const question of questions) {
    const parentId = getQuestionParentId(question, sectionQuestionIds);
    if (parentId) {
      const current = childMap.get(parentId) ?? [];
      childMap.set(parentId, [...current, question.clientId]);
    } else {
      rootIds.push(question.clientId);
    }
  }

  return {
    rootIds,
    childMap,
    questionById,
  };
}
