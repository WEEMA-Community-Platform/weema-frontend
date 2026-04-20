export type SectionMeta = {
  group: string;
  label: string;
  description: string;
};

/**
 * Translation-key maps. Actual copy is resolved in client components via
 * `useTranslations("sections.*")`.
 */
export const SECTION_META_KEYS: Record<string, string> = {
  shg: "sections.shg",
  member: "sections.member",
  profile: "sections.profile",
};

export const PATH_META_KEYS: Record<string, string> = {
  "/survey": "sections.survey",
  "/survey/submissions": "sections.surveySubmissions",
};

/**
 * Back-compat English copy retained so any non-client context still renders
 * sensible text; client components should prefer the translation keys above.
 */
export const SECTION_META: Record<string, SectionMeta> = {
  shg: {
    group: "Community",
    label: "Self-Help Groups",
    description: "View self-help groups and their cluster assignments.",
  },
  member: {
    group: "Community",
    label: "Members",
    description: "Register and manage members within self-help groups.",
  },
  profile: {
    group: "Account",
    label: "My profile",
    description: "Update your name and review your account details.",
  },
};

export const PATH_META: Record<string, SectionMeta> = {
  "/survey": {
    group: "Survey",
    label: "Surveys",
    description:
      "Browse assigned surveys and submit responses for members.",
  },
  "/survey/submissions": {
    group: "Survey",
    label: "Survey submissions",
    description: "Review submission progress and fill in member answers.",
  },
};
