"use client";

// GET /auth/me populates the user and permission list (FE-SPEC.md §10).
// The (app) route group's guard is just this hook plus a check on
// isPending/isError — no separate "am I logged in" flag exists anywhere.
// Any component that needs the current user calls this directly rather
// than receiving it through a context that mirrors the query result:
// server state lives only in TanStack Query (CLAUDE.md invariant #1).

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query/keys";
import type { Me } from "@/types/api";

export function useSession() {
  return useQuery<Me, ApiError>({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiGet<Me>("/auth/me"),
    // A 401 here won't succeed on retry — the global handler in
    // lib/query/provider.tsx redirects to /login as soon as it fails.
    // Retrying first would only delay that redirect.
    retry: false,
  });
}
