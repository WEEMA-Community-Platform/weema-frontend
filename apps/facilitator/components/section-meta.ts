export const SECTION_META: Record<
  string,
  { group: string; label: string; description: string }
> = {
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

export const PATH_META: Record<string, { group: string; label: string; description: string }> = {
  "/survey": {
    group: "Survey",
    label: "Surveys",
    description: "Browse assigned surveys and submit responses for members.",
  },
  "/survey/submissions": {
    group: "Survey",
    label: "Survey submissions",
    description: "Review submission progress and fill in member answers.",
  },
};
