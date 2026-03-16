"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { Toaster } from "sileo";
import "sileo/styles.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
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

