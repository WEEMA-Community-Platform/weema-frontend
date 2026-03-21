"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-user";
import { SUPER_ADMIN_ROLE } from "@/components/users/constants";
import { UserManagementManager } from "@/components/users/user-management-manager";

export function AdminUsersSection() {
  const { data, isLoading } = useCurrentUser();
  const role = data?.user?.role;

  if (isLoading) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>User management</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (role !== SUPER_ADMIN_ROLE) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>User management</CardTitle>
          <CardDescription>
            Only super administrators can list users, create accounts, and change activation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <UserManagementManager />;
}
