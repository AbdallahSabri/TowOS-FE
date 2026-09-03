import type { ReactNode } from "react";

// Placeholder shell. Phase 0 slice 2 adds the auth guard (GET /auth/me) and
// nav/user menu/banner slot (FE-SPEC.md §10).
export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
