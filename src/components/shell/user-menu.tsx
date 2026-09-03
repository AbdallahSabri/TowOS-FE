"use client";

import { useLogout } from "@/lib/auth/logout";
import type { Me } from "@/types/api";

export function UserMenu({ user }: { user: Me }) {
  const logout = useLogout();

  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{user.name || user.email}</span>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="rounded border border-black/20 px-2 py-1 disabled:opacity-50"
      >
        {logout.isPending ? "Signing out…" : "Sign out"}
      </button>
      {logout.isError && (
        <span role="alert" className="text-red-600">
          Couldn&apos;t sign out. Check your connection and try again.
        </span>
      )}
    </div>
  );
}
