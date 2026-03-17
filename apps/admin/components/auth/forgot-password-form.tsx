"use client";

import { useResetPasswordMutation, useRequestOtpMutation, useVerifyOtpMutation } from "@weema/auth/react-query";
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

  const requestOtpMutation = useRequestOtpMutation({ baseUrl: "/api/auth" });
  const verifyOtpMutation = useVerifyOtpMutation({ baseUrl: "/api/auth" });
  const resetPasswordMutation = useResetPasswordMutation({ baseUrl: "/api/auth" });

  return (
    <Card className="mx-auto w-full max-w-md border-primary/15 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-xl">Reset password</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <p className="text-sm text-muted-foreground">
            Enter your email, verify the OTP, then set a new password.
          </p>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@weema.com"
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
                      title: "Email required",
                      description: "Enter your email to request an OTP.",
                    });
                    return;
                  }

                  try {
                    const result = await requestOtpMutation.mutateAsync(email.trim());
                    sileo.success({
                      title: "OTP sent",
                      description: result.message,
                    });
                  } catch (error) {
                    sileo.error({
                      title: "Could not send OTP",
                      description:
                        error instanceof Error ? error.message : "Unexpected error",
                    });
                  }
                }}
              >
                Send OTP
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="otp">OTP code</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="otp"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value);
                  setIsOtpVerified(false);
                }}
                placeholder="123456"
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
                      title: "Missing fields",
                      description: "Enter both email and OTP to verify.",
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
                      title: "OTP verified",
                      description: result.message,
                    });
                  } catch (error) {
                    setIsOtpVerified(false);
                    sileo.error({
                      title: "Invalid OTP",
                      description:
                        error instanceof Error ? error.message : "Unexpected error",
                    });
                  }
                }}
              >
                Verify
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
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
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
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
                  title: "Missing fields",
                  description: "Complete all fields before submitting.",
                });
                return;
              }

              if (!isOtpVerified) {
                sileo.warning({
                  title: "Verify OTP first",
                  description: "Please verify the OTP before resetting password.",
                });
                return;
              }

              if (newPassword !== confirmPassword) {
                sileo.warning({
                  title: "Passwords do not match",
                  description: "Confirm password must match the new password.",
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
                  title: "Password reset successful",
                  description: result.message,
                });
                router.push("/login");
              } catch (error) {
                sileo.error({
                  title: "Reset failed",
                  description:
                    error instanceof Error ? error.message : "Unexpected error",
                });
              }
            }}
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
          </Button>

          <p className="text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="text-primary underline-offset-2 hover:underline">
              Back to login
            </Link>
          </p>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
