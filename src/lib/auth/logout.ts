"use client";

// Logout clears the query cache and calls POST /auth/logout (FE-SPEC.md
// §10). The redirect mirrors the global 401 handler in
// lib/query/provider.tsx (hard reload, not next/navigation's router) so
// there's one pattern for "the session just ended, leave nothing behind."
//
// Only a successful logout clears the cache and redirects — a network
// failure here says nothing about whether the session ended server-side,
// so it just surfaces as a normal mutation error for the caller to show
// inline and let the user retry.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/client";
import { useIdempotencyKey } from "@/lib/api/idempotency";

export function useLogout() {
  const queryClient = useQueryClient();
  const { key } = useIdempotencyKey();

  return useMutation({
    mutationFn: () => apiPost<void>("/auth/logout", {}, key),
    onSuccess: () => {
      queryClient.clear();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate hard reload after the session ends, matching the global 401 handler's pattern (see lib/query/provider.tsx).
      window.location.href = "/login";
    },
  });
}
