"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 45_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
