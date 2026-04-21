"use client";

import { useResetPasswordMutation, useRequestOtpMutation, useVerifyOtpMutation } from "@weema/auth/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const t = useTranslations("auth.forgotPassword");
  const tToasts = useTranslations("auth.forgotPassword.toast");

  const requestOtpMutation = useRequestOtpMutation({ baseUrl: "/api/auth" });
  const verifyOtpMutation = useVerifyOtpMutation({ baseUrl: "/api/auth" });
  const resetPasswordMutation = useResetPasswordMutation({ baseUrl: "/api/auth" });

  return (
    <Card className="mx-auto w-full max-w-md border-primary/15 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-xl">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <p className="text-sm text-muted-foreground">{t("intro")}</p>

          <Field>
            <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("emailPlaceholder")}
                className="h-11"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={requestOtpMutation.isPending}
                onClick={async () => {
                  if (!email.trim()) {
                    sileo.warning({
                      title: tToasts("emailRequiredTitle"),
                      description: tToasts("emailRequiredMessage"),
                    });
                    return;
                  }

                  try {
                    const result = await requestOtpMutation.mutateAsync(email.trim());
                    sileo.success({
                      title: tToasts("otpSentTitle"),
                      description: result.message,
                    });
                  } catch (error) {
                    sileo.error({
                      title: tToasts("otpErrorTitle"),
                      description:
                        error instanceof Error ? error.message : "Unexpected error",
                    });
                  }
                }}
              >
                {t("sendOtp")}
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="otp">{t("otp")}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="otp"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value);
                  setIsOtpVerified(false);
                }}
                placeholder={t("otpPlaceholder")}
                className="h-11"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={verifyOtpMutation.isPending}
                onClick={async () => {
                  if (!email.trim() || !otp.trim()) {
                    sileo.warning({
                      title: tToasts("missingFieldsTitle"),
                      description: tToasts("missingFieldsBothMessage"),
                    });
                    return;
                  }

                  try {
                    const result = await verifyOtpMutation.mutateAsync({
                      email: email.trim(),
                      otp: otp.trim(),
                    });
                    setIsOtpVerified(true);
                    sileo.success({
                      title: tToasts("otpVerifiedTitle"),
                      description: result.message,
                    });
                  } catch (error) {
                    setIsOtpVerified(false);
                    sileo.error({
                      title: tToasts("otpInvalidTitle"),
                      description:
                        error instanceof Error ? error.message : "Unexpected error",
                    });
                  }
                }}
              >
                {t("verify")}
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="newPassword">{t("newPassword")}</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-11"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("confirmPassword")}
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11"
              required
            />
          </Field>

          <Button
            type="button"
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={resetPasswordMutation.isPending}
            onClick={async () => {
              if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
                sileo.warning({
                  title: tToasts("missingFieldsTitle"),
                  description: tToasts("completeFieldsMessage"),
                });
                return;
              }

              if (!isOtpVerified) {
                sileo.warning({
                  title: tToasts("verifyFirstTitle"),
                  description: tToasts("verifyFirstMessage"),
                });
                return;
              }

              if (newPassword !== confirmPassword) {
                sileo.warning({
                  title: tToasts("passwordMismatchTitle"),
                  description: tToasts("passwordMismatchMessage"),
                });
                return;
              }

              try {
                const result = await resetPasswordMutation.mutateAsync({
                  email: email.trim(),
                  otp: otp.trim(),
                  newPassword,
                });
                sileo.success({
                  title: tToasts("resetSuccessTitle"),
                  description: result.message,
                });
                router.push("/login");
              } catch (error) {
                sileo.error({
                  title: tToasts("resetFailedTitle"),
                  description:
                    error instanceof Error ? error.message : "Unexpected error",
                });
              }
            }}
          >
            {resetPasswordMutation.isPending ? t("resetting") : t("reset")}
          </Button>

          <p className="text-sm text-muted-foreground">
            {t("rememberPassword")}{" "}
            <Link href="/login" className="text-primary underline-offset-2 hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
