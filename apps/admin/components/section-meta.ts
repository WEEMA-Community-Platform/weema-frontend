export type SectionMetaKey = {
  groupKey: string;
  labelKey: string;
  descriptionKey: string;
};

export const SECTION_META_KEYS: Record<string, SectionMetaKey> = {
  region: {
    groupKey: "sections.region.group",
    labelKey: "sections.region.label",
    descriptionKey: "sections.region.description",
  },
  zone: {
    groupKey: "sections.zone.group",
    labelKey: "sections.zone.label",
    descriptionKey: "sections.zone.description",
  },
  woreda: {
    groupKey: "sections.woreda.group",
    labelKey: "sections.woreda.label",
    descriptionKey: "sections.woreda.description",
  },
  kebele: {
    groupKey: "sections.kebele.group",
    labelKey: "sections.kebele.label",
    descriptionKey: "sections.kebele.description",
  },
  religion: {
    groupKey: "sections.religion.group",
    labelKey: "sections.religion.label",
    descriptionKey: "sections.religion.description",
  },
  federation: {
    groupKey: "sections.federation.group",
    labelKey: "sections.federation.label",
    descriptionKey: "sections.federation.description",
  },
  cluster: {
    groupKey: "sections.cluster.group",
    labelKey: "sections.cluster.label",
    descriptionKey: "sections.cluster.description",
  },
  shg: {
    groupKey: "sections.shg.group",
    labelKey: "sections.shg.label",
    descriptionKey: "sections.shg.description",
  },
  member: {
    groupKey: "sections.member.group",
    labelKey: "sections.member.label",
    descriptionKey: "sections.member.description",
  },
  profile: {
    groupKey: "sections.profile.group",
    labelKey: "sections.profile.label",
    descriptionKey: "sections.profile.description",
  },
  users: {
    groupKey: "sections.users.group",
    labelKey: "sections.users.label",
    descriptionKey: "sections.users.description",
  },
};

export const PATH_META_KEYS: Record<string, SectionMetaKey> = {
  "/survey": {
    groupKey: "sections.survey.group",
    labelKey: "sections.survey.label",
    descriptionKey: "sections.survey.description",
  },
  "/survey/submissions": {
    groupKey: "sections.surveySubmissions.group",
    labelKey: "sections.surveySubmissions.label",
    descriptionKey: "sections.surveySubmissions.description",
  },
};

// Back-compat shim for non-client contexts / existing imports.
// Prefer SECTION_META_KEYS / PATH_META_KEYS with useTranslations.
export const SECTION_META = SECTION_META_KEYS as unknown as Record<
  string,
  { group: string; label: string; description: string }
>;
export const PATH_META = PATH_META_KEYS as unknown as Record<
  string,
  { group: string; label: string; description: string }
>;
