"use client";

import type { ReactNode } from "react";
import { Shell } from "@/components/shell/shell";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/auth/session";

// Authenticated shell (FE-SPEC.md §10): GET /auth/me gates every page in
// this route group — nothing under here renders before that call
// resolves. A SESSION_EXPIRED failure is already handled by the global
// QueryCache handler in lib/query/provider.tsx (cache clear + redirect),
// so this just waits it out rather than rendering anything. Any other
// failure (the API being unreachable, say) gets its own inline retry
// instead of leaving the user on a screen that can never resolve.
export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();

  if (session.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>Checking your session…</p>
      </main>
    );
  }

  if (session.isError) {
    if (session.error instanceof ApiError && session.error.code === "SESSION_EXPIRED") {
      return null;
    }

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3">
        <p role="alert">{session.error.message}</p>
        <button
          type="button"
          onClick={() => session.refetch()}
          className="rounded border border-black/20 px-3 py-2"
        >
          Try again
        </button>
      </main>
    );
  }

  return <Shell user={session.data}>{children}</Shell>;
}
