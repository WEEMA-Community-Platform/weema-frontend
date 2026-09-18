"use client";

import { useTranslations } from "next-intl";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-user";
import { SUPER_ADMIN_ROLE } from "@/components/users/constants";
import { UserManagementManager } from "@/components/users/user-management-manager";
import { normalizeRole } from "@weema/auth";

export function AdminUsersSection() {
  const { data, isLoading } = useCurrentUser();
  const role = data?.user?.role;
  const t = useTranslations("users.section");

  if (isLoading) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("loading")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const normalizedRole = normalizeRole(role);
  if (role !== SUPER_ADMIN_ROLE && normalizedRole !== "viewer_admin") {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("restriction")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <UserManagementManager />;
}
