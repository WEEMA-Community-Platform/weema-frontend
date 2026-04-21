import { useTranslations } from "next-intl";

/** Backend role strings for user create / filters. Labels are English fallbacks — prefer `useUserRoleOptions` in client components. */
export const USER_ROLE_OPTIONS = [
  { value: "ROLE_SUPER_ADMIN", label: "Super admin" },
  { value: "ROLE_CLUSTER_ADMIN", label: "Cluster admin" },
  { value: "ROLE_FACILITATOR", label: "Facilitator" },
] as const;

/** English fallback used outside React render (non-hook contexts). */
export function formatRoleLabel(role: string): string {
  return role.replace(/^ROLE_/, "").replace(/_/g, " ");
}

/** Maps a backend role string (`ROLE_SUPER_ADMIN`) to its `users.roles.*` translation key suffix. */
function roleTranslationKey(role: string): string | null {
  switch (role) {
    case "ROLE_SUPER_ADMIN":
      return "SUPER_ADMIN";
    case "ROLE_CLUSTER_ADMIN":
      return "CLUSTER_ADMIN";
    case "ROLE_FACILITATOR":
      return "FACILITATOR";
    default:
      return null;
  }
}

/** Hook returning a translator that maps a backend role to its localized label. */
export function useRoleLabel() {
  const t = useTranslations("users.roles");
  return (role: string) => {
    const key = roleTranslationKey(role);
    return key ? t(key) : formatRoleLabel(role);
  };
}

/** Hook returning `USER_ROLE_OPTIONS` with localized labels. */
export function useUserRoleOptions() {
  const t = useTranslations("users.roles");
  return [
    { value: "ROLE_SUPER_ADMIN", label: t("SUPER_ADMIN") },
    { value: "ROLE_CLUSTER_ADMIN", label: t("CLUSTER_ADMIN") },
    { value: "ROLE_FACILITATOR", label: t("FACILITATOR") },
  ];
}

export const SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";
