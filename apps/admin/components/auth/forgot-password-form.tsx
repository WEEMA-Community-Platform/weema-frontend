"use client";

import { useResetPasswordMutation, useRequestOtpMutation, useVerifyOtpMutation } from "@weema/auth/react-query";
import { ArrowLeft, Check, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Step = "email" | "otp" | "password";
const STEPS: Step[] = ["email", "otp", "password"];

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const t = useTranslations("auth.forgotPassword");
  const toast = useTranslations("auth.forgotPassword.toast");
  const requestOtp = useRequestOtpMutation({ baseUrl: "/api/auth" });
  const verifyOtp = useVerifyOtpMutation({ baseUrl: "/api/auth" });
  const resetPassword = useResetPasswordMutation({ baseUrl: "/api/auth" });

  const reportError = (title: string, error: unknown) => sileo.error({ title, description: error instanceof Error ? error.message : "Unexpected error" });
  const sendOtp = async (event?: FormEvent) => { event?.preventDefault(); if (!email.trim()) { sileo.warning({ title: toast("emailRequiredTitle"), description: toast("emailRequiredMessage") }); return; } try { const result = await requestOtp.mutateAsync(email.trim()); setOtp(""); setStep("otp"); sileo.success({ title: toast("otpSentTitle"), description: result.message }); } catch (error) { reportError(toast("otpErrorTitle"), error); } };
  const verify = async (event: FormEvent) => { event.preventDefault(); if (!otp.trim()) { sileo.warning({ title: toast("missingFieldsTitle"), description: toast("missingFieldsBothMessage") }); return; } try { const result = await verifyOtp.mutateAsync({ email: email.trim(), otp: otp.trim() }); setStep("password"); sileo.success({ title: toast("otpVerifiedTitle"), description: result.message }); } catch (error) { reportError(toast("otpInvalidTitle"), error); } };
  const reset = async (event: FormEvent) => { event.preventDefault(); if (!newPassword || !confirmPassword) { sileo.warning({ title: toast("missingFieldsTitle"), description: toast("completeFieldsMessage") }); return; } if (newPassword !== confirmPassword) { sileo.warning({ title: toast("passwordMismatchTitle"), description: toast("passwordMismatchMessage") }); return; } try { const result = await resetPassword.mutateAsync({ email: email.trim(), otp: otp.trim(), newPassword }); sileo.success({ title: toast("resetSuccessTitle"), description: result.message }); router.push("/login"); } catch (error) { reportError(toast("resetFailedTitle"), error); } };
  const stepIndex = STEPS.indexOf(step);

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden border-primary/15 shadow-lg shadow-primary/5">
      <CardHeader className="space-y-4 border-b border-primary/10"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">{step === "email" ? <Mail className="size-5" /> : step === "otp" ? <ShieldCheck className="size-5" /> : <KeyRound className="size-5" />}</div><div><CardTitle className="text-xl">{t("title")}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p></div></div><div className="flex gap-2" aria-label="Password reset progress">{STEPS.map((item, index) => <span key={item} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${index <= stepIndex ? "bg-primary" : "bg-muted"}`} />)}</div></CardHeader>
      <CardContent className="pt-6"><div key={step} className="animate-in fade-in-0 slide-in-from-right-4 duration-300 motion-reduce:animate-none">
        {step === "email" ? <form onSubmit={sendOtp}><FieldGroup><Field><FieldLabel htmlFor="reset-email" required>{t("email")}</FieldLabel><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} className="h-11" autoFocus required /></Field><Button className="h-11 w-full" disabled={requestOtp.isPending}>{requestOtp.isPending ? `${t("sendOtp")}…` : t("sendOtp")}</Button></FieldGroup></form>
        : step === "otp" ? <form onSubmit={verify}><FieldGroup><div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{email}</div><Field><FieldLabel htmlFor="reset-otp" required>{t("otp")}</FieldLabel><Input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder={t("otpPlaceholder")} className="h-12 text-center text-lg tracking-[0.35em]" autoFocus required /></Field><Button className="h-11 w-full" disabled={verifyOtp.isPending}>{verifyOtp.isPending ? `${t("verify")}…` : t("verify")}</Button><div className="flex items-center justify-between"><Button type="button" variant="ghost" size="sm" onClick={() => setStep("email")}><ArrowLeft className="size-4" />{t("email")}</Button><Button type="button" variant="ghost" size="sm" disabled={requestOtp.isPending} onClick={() => void sendOtp()}>{t("sendOtp")}</Button></div></FieldGroup></form>
        : <form onSubmit={reset}><FieldGroup><div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"><Check className="size-4" />{toast("otpVerifiedTitle")}</div><Field><FieldLabel htmlFor="new-password" required>{t("newPassword")}</FieldLabel><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11" autoFocus required /></Field><Field><FieldLabel htmlFor="confirm-password" required>{t("confirmPassword")}</FieldLabel><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" required /></Field><Button className="h-11 w-full" disabled={resetPassword.isPending}>{resetPassword.isPending ? t("resetting") : t("reset")}</Button><Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => { setNewPassword(""); setConfirmPassword(""); setStep("otp"); }}><ArrowLeft className="size-4" />{t("otp")}</Button></FieldGroup></form>}
      </div><p className="mt-6 text-sm text-muted-foreground">{t("rememberPassword")} <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">{t("backToLogin")}</Link></p></CardContent>
    </Card>
  );
}
