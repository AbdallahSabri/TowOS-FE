"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";

// A 401/SESSION_EXPIRED from *any* query or mutation clears the cache and
// hard-redirects to /login (FE-SPEC.md §6). Centralized here — rather than
// in lib/api/client.ts — so it fires uniformly regardless of which screen
// triggered it, and client.ts stays free of navigation concerns. A hard
// redirect (not next/navigation's router) is deliberate: there's no
// component context available from a cache callback, and a full reload
// guarantees no stale client state survives the session ending.
//
// Wired through QueryCache/MutationCache (not defaultOptions.queries/
// mutations.onError) because those global callbacks always fire, whereas a
// default onError is silently replaced if a call site passes its own — this
// has to run unconditionally.
//
// A 403 is NOT handled here — §6 says it renders a permission message, not a
// redirect, so it's left for the calling component to render from the
// thrown ApiError. Same for NETWORK_ERROR: it says nothing about the
// session, so it just surfaces as a normal query/mutation error.
function handleGlobalError(error: unknown, queryClient: QueryClient) {
  if (error instanceof ApiError && error.code === "SESSION_EXPIRED") {
    queryClient.clear();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- this runs from a cache callback outside the component tree, so neither redirect() nor useRouter() is reachable; a hard reload is the intended behavior, not a workaround.
    window.location.href = "/login";
  }
}

// Defaults per FE-SPEC.md §7. Per-query overrides (refetchInterval) land in Phase 1.
function makeQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => handleGlobalError(error, queryClient),
    }),
    mutationCache: new MutationCache({
      onError: (error) => handleGlobalError(error, queryClient),
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        retry: 1,
        staleTime: 0,
      },
      mutations: {
        retry: 0,
      },
    },
  });
  return queryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
