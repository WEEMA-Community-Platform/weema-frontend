/** Backend role strings for user create / filters */
export const USER_ROLE_OPTIONS = [
  { value: "ROLE_SUPER_ADMIN", label: "Super admin" },
  { value: "ROLE_CLUSTER_ADMIN", label: "Cluster admin" },
  { value: "ROLE_FACILITATOR", label: "Facilitator" },
] as const;

export function formatRoleLabel(role: string): string {
  return role.replace(/^ROLE_/, "").replace(/_/g, " ");
}

export const SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";
