"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { Toaster } from "sileo";
import "sileo/styles.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof Error && error.message === "Unauthorized") {
              window.location.href = "/login";
            }
          },
        }),
        defaultOptions: {
          queries: {
            /** Fresh longer; mutations still invalidate by query key. */
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
      })
  );

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

