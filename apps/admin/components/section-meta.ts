export const SECTION_META: Record<
  string,
  { group: string; label: string; description: string }
> = {
  region: {
    group: "Base Data",
    label: "Regions",
    description: "Manage administrative regions.",
  },
  zone: {
    group: "Base Data",
    label: "Zones",
    description: "Manage zones within regions.",
  },
  woreda: {
    group: "Base Data",
    label: "Woredas",
    description: "Manage woredas within zones.",
  },
  kebele: {
    group: "Base Data",
    label: "Kebeles",
    description: "Manage kebeles within woredas.",
  },
  religion: {
    group: "Base Data",
    label: "Religions",
    description: "Manage reference religion data.",
  },
  federation: {
    group: "Community Structure",
    label: "Federations",
    description: "Manage federations that group clusters together.",
  },
  cluster: {
    group: "Community Structure",
    label: "Clusters",
    description: "Manage clusters linked to woredas and federations.",
  },
  shg: {
    group: "Community Structure",
    label: "Self-Help Groups",
    description: "Manage self-help groups and their cluster assignments.",
  },
  member: {
    group: "Community Structure",
    label: "Members",
    description: "Register and manage members within self-help groups.",
  },
  profile: {
    group: "Account",
    label: "My profile",
    description: "Update your name and review your account details.",
  },
  users: {
    group: "User Management",
    label: "Users",
    description: "Create users and manage activation (super admin).",
  },
};

export const PATH_META: Record<string, { group: string; label: string; description: string }> = {
  "/survey": {
    group: "Survey",
    label: "Surveys",
    description: "Browse, create, and manage surveys.",
  },
  "/survey/submissions": {
    group: "Survey",
    label: "Survey submissions",
    description: "Review submitted answers and submission progress by survey.",
  },
};
