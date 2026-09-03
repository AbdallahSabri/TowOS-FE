import type { ReactNode } from "react";
import type { Me } from "@/types/api";
import { UserMenu } from "./user-menu";

export function Shell({ user, children }: { user: Me; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <span className="font-semibold">TowOS</span>
        <UserMenu user={user} />
      </header>
      {/* Integration status banner slot (FE-SPEC.md §5). Empty until a Phase 2
          admin screen wires a provider-status banner here — staleness and
          degraded integrations render as a banner, never a toast or modal
          (CLAUDE.md invariant #8). */}
      <div data-slot="integration-banner" />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
