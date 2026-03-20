"use client";

import { cn } from "@/lib/utils";
import { useLoginMutation } from "@weema/auth/react-query";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = searchParams.get("returnTo") ?? "/";

  const loginMutation = useLoginMutation({
    baseUrl: "/api/auth",
    onSuccess: (data) => {
      sileo.success({
        title: "Logged in",
        description: data.message || "Welcome back.",
      });
      router.push(returnTo);
      router.refresh();
    },
    onError: (error) => {
      sileo.error({
        title: "Login failed",
        description: error.message,
      });
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-primary/15 p-0 shadow-lg shadow-primary/5">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="bg-card p-6 md:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate({ email, password });
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to your WEEMA Admin account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@weema.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 border-primary/20 bg-background px-3 text-[0.95rem] md:text-base focus-visible:border-primary focus-visible:ring-0"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 border-primary/20 bg-background px-3 pr-11 text-[0.95rem] md:text-base focus-visible:border-primary focus-visible:ring-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end pt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="w-full bg-primary py-5 text-primary-foreground hover:bg-primary/90"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,oklch(0.72_0.17_45/.35),transparent_42%),radial-gradient(circle_at_80%_70%,oklch(0.58_0.14_40/.32),transparent_48%)]" />
            <Image
              src="/weema-logo.png"
              alt="WEEMA International"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="absolute inset-0 object-contain p-10"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

