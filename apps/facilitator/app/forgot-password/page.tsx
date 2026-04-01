import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,oklch(0.97_0.02_250),oklch(0.99_0.005_250)_35%,oklch(0.99_0_0))] px-4 py-10">
      <ForgotPasswordForm />
    </main>
  );
}
