// CLAUDE.md invariant #7: the UI hides what a role can't do based on the
// permission list GET /auth/me actually returned — never a hardcoded role
// check. This is the one place that reads `permissions`, so no component
// re-derives its own notion of who can do what.
//
// Phase 0 has no permission-gated screens yet (no board, no admin), so
// nothing calls this today. It exists now so Phase 1 has the right shape
// to build against instead of inventing a client-side check under
// deadline.

import type { Me, Permission } from "@/types/api";

export function hasPermission(session: Me | undefined, permission: Permission): boolean {
  return session?.permissions.includes(permission) ?? false;
}
