import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { ACCESS_TOKEN_COOKIE, getTokenRole, isAllowedFacilitatorRole } from "@/lib/auth";

export default async function LoginPage() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const role = getTokenRole(token);

  if (token && isAllowedFacilitatorRole(role)) {
    redirect("/");
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[linear-gradient(160deg,oklch(0.98_0.02_50),oklch(0.965_0.012_72)_45%,oklch(0.955_0.018_40))] p-6 md:p-10 dark:bg-[linear-gradient(160deg,oklch(0.21_0.01_25),oklch(0.16_0.01_35)_60%,oklch(0.13_0.012_20))]">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </main>
  );
}
