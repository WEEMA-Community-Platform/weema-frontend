# Survey Module (Admin) - Implementation Guide

This document explains the current survey implementation in `apps/admin`, including:

- where API wiring lives,
- where follow-up rule enum values live,
- how save orchestration works (create vs save-all vs entity-level save),
- and how to keep `survey-builder-page.tsx` from growing further.

## 1) User flow

1. Open `Survey` from sidebar.
2. `/(main)/survey` renders survey cards.
3. Card menu action `Open survey` navigates to `/survey/builder?id=<surveyId>`.
4. `/survey/builder` renders standalone full-page builder.

## 2) Frontend routes

- `app/(main)/survey/page.tsx` - survey list screen in admin shell.
- `app/survey/builder/page.tsx` - standalone builder entrypoint.

## 3) API proxy routes (Next -> backend)

### Survey

- `app/api/survey/route.ts`
  - `GET /api/survey`
  - `POST /api/survey`
- `app/api/survey/[id]/route.ts`
  - `GET /api/survey/{id}`
  - `PATCH /api/survey/{id}`
  - `DELETE /api/survey/{id}`
- `app/api/survey/[id]/publish/route.ts`
  - `POST /api/survey/{id}/publish`

### Survey sections

- `app/api/survey-section/survey/[surveyId]/route.ts`
  - `POST /api/survey-section/survey/{survey-id}`
- `app/api/survey-section/[id]/route.ts`
  - `PATCH /api/survey-section/{id}`
  - `DELETE /api/survey-section/{id}`
- `app/api/survey-section/reorder/route.ts`
  - `POST /api/survey-section/reorder`

### Questions

- `app/api/question/section/[sectionId]/route.ts`
  - `POST /api/question/section/{section-id}`
- `app/api/question/[id]/route.ts`
  - `PATCH /api/question/{id}`
  - `DELETE /api/question/{id}`
- `app/api/question/reorder/route.ts`
  - `POST /api/question/reorder`

## 4) API client and hooks

- `lib/api/surveys.ts`
  - request functions + payload serializers:
    - `serializeSectionPayload(...)`
    - `serializeQuestionPayload(...)`
- `hooks/use-surveys.ts`
  - React Query mutations/queries for survey, section, and question operations.

## 5) Builder save model (important)

`components/survey/survey-builder-page.tsx` uses a **hybrid flow**:

- New survey flow:
  - users can draft sections/questions locally first.
  - from question editor, primary action is `Create survey`.
  - create call posts full survey payload once (`POST /api/survey`).

- Existing survey flow:
  - header action is `Save all changes` (for existing survey).
  - save-all first validates, then syncs:
    1) survey settings (`PATCH /api/survey/{id}`),
    2) unsynced sections (`POST /api/survey-section/survey/{survey-id}`),
    3) unsynced questions (`POST /api/question/section/{section-id}`),
    4) synced section updates (`PATCH /api/survey-section/{id}`),
    5) synced question updates (`PATCH /api/question/{id}`).
  - button is disabled when there are no unsaved changes (snapshot-based dirty check).
  - per-section and per-question save actions remain available for targeted saves.
  - section save button -> create/update section endpoint.
  - question save button -> create/update question endpoint.

- Section reorder -> `/api/survey-section/reorder` when IDs are available.
- Question reorder -> `/api/question/reorder` when IDs are available.
- Deletes use section/question delete endpoints when IDs are available.

This keeps initial creation simple while still allowing granular and bulk-save operations after creation.

## 5.1) Section draft behavior

- `Add section` adds section locally in the builder first.
- users can add/manage questions under that section before saving it to backend.
- section card `Save` button posts the section (including local questions) through survey-section create/update APIs.

## 5.2) Follow-up chaining

- Follow-up questions support:
  - direct follow-up (level 1),
  - one nested follow-up level (level 2).
- In question editor:
  - root question shows `Add follow-up question`.
  - follow-up question shows:
    - `Add sibling follow-up` (same parent),
    - `Add nested follow-up` (child of that follow-up).
  - `Add nested follow-up` is disabled when max depth is reached (no level 3+).
  - manual `Add rule` action was removed to avoid accidental rule mutation.
- Sidebar tree rendering supports parent -> follow-up -> nested follow-up hierarchy and labels depth.
- Card view (`question-cards-board`) also shows follow-up hierarchy, including nested indicators.

## 6) Follow-up enums and where to change them

If you want to add/remove follow-up operators or related enum values, update these files:

1. **Canonical type union**
   - `lib/survey-builder/types.ts`
   - `ConditionOperator` is the source-of-truth TypeScript union.

2. **UI dropdown labels**
   - `components/survey/builder/shared.ts`
   - `OPERATOR_OPTIONS` controls what appears in the follow-up rule operator select.

3. **Description text rendering**
   - `components/survey/builder/shared.ts`
   - `getOperatorLabel(...)` and `describeCondition(...)`.

4. **API payload expectations**
   - `lib/api/surveys.ts`
   - `serializeQuestionPayload(...)` sends `showConditions`.

### Quick example: add a new operator

1. Add operator to `ConditionOperator` in `lib/survey-builder/types.ts`.
2. Add it in `OPERATOR_OPTIONS` in `components/survey/builder/shared.ts`.
3. Verify backend supports it.
4. Typecheck and test question rule edit UI.

## 7) Other enum/value sets

- Question types: `QUESTION_TYPES` in `lib/survey-builder/utils.ts`
- JSON component types: `JSON_TYPES` in `lib/survey-builder/utils.ts`
- Target types: `TARGET_TYPES` in `lib/survey-builder/utils.ts`

If you add/remove one, also verify:

- normalization in `lib/survey-builder/normalize.ts`,
- preview/editor rendering in `components/survey/builder/question-editor.tsx` and `components/survey/survey-preview-panel.tsx`,
- backend accepts that value.

## 8) Why `survey-builder-page.tsx` is still large

The page still owns orchestration concerns:

- hydration/reload,
- left-nav interactions,
- dialog state,
- save/delete/reorder mutation wiring,
- selected section/question routing.

Complex UI blocks are already extracted (`question-editor`, `question-cards-board`, `shared`), but orchestration remains centralized.

Recent optimizations already applied:

- follow-up condition creation extracted into shared helper logic in page-level orchestration,
- section-question tree building extracted to `buildSectionQuestionTree(...)` in `builder/shared.ts`,
- snapshot-based dirty tracking added to avoid redundant save-all calls.

## 9) Next refactor targets (recommended)

To reduce file size safely, extract next in this order:

1. `useSurveyBuilderPersistence` hook
   - save/delete/reorder/reload mutation orchestration.
2. `BuilderNavigator` component
   - left panel sections/questions tree + drag/drop.
3. `BuilderDialogs` component
   - delete/reorder alert dialogs.
4. `BuilderHeaderActions` component
   - create survey/save-all state/inline guidance.

Goal: keep `survey-builder-page.tsx` as a route-level composition file only.

## 10) Contributor notes

- Keep parent-child follow-up grouping behavior intact.
- Keep alert dialogs consistent with app `AlertDialog` patterns.
- Prefer adding new behavior in extracted components/hooks instead of expanding route component logic.
- Builder should open in `Survey settings` first, then users navigate to sections/questions.
- For existing surveys, `Save all changes` should only be enabled when unsaved changes exist.
