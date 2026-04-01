"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { Toaster } from "sileo";
import "sileo/styles.css";
import { TooltipProvider } from "@/components/ui/tooltip";

function isSessionExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const msg = error.message.trim();
  if (msg === "Unauthorized") return true;
  const lower = msg.toLowerCase();
  return (
    lower.includes("token refresh failed") ||
    lower.includes("missing refresh token") ||
    lower.includes("jwt expired") ||
    lower.includes("token expired") ||
    lower.includes("session expired")
  );
}

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    let redirected = false;
    const redirectToLogin = () => {
      if (redirected || typeof window === "undefined") return;
      redirected = true;
      const returnTo = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      );
      window.location.assign(`/login?returnTo=${returnTo}`);
    };

    const onSessionError = (error: unknown) => {
      if (isSessionExpiredError(error)) {
        redirectToLogin();
      }
    };

    return new QueryClient({
      queryCache: new QueryCache({
        onError: onSessionError,
      }),
      mutationCache: new MutationCache({
        onError: onSessionError,
      }),
      defaultOptions: {
        queries: {
          staleTime: 15 * 60 * 1000,
          gcTime: 45 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          retry: 1,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          options={{
            roundness: 12,
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
