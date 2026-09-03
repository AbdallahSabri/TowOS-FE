// Query key factory (FE-SPEC.md §7). Every query's key is defined here as
// one source of truth for cache addressing and invalidation — never an
// inline array literal at the call site.
//
// Convention per resource, broadest to narrowest, so a mutation can
// invalidate at whatever level it actually affects:
//   jobs.all()            -> ['jobs']
//   jobs.list(filters)    -> ['jobs', 'list', filters]
//   jobs.detail(id)       -> ['jobs', 'detail', id]
//
// Phase 0 has no jobs/drivers queries yet — Phase 1 adds those entries
// here as the board and job screens land. `auth.me()` is Phase 0's one
// real query: the (app) route group's session guard (FE-SPEC.md §10).
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
} as const;
