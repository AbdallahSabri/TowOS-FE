// Hand-written types matching the API contract (FE-SPEC.md §5). Switch to
// generated types instead of extending this file, if the API repo starts
// publishing them.

// PLACEHOLDER: BE-SPEC.md documents GET /auth/me's exact response shape;
// it isn't checked into this repo, so these fields are a reasonable,
// minimal guess (id/email/name/role/permissions). Update the fields when
// the real contract is available — `permissions` is deliberately an opaque
// string list rather than a fixed union, since the taxonomy isn't ours to
// invent (CLAUDE.md invariant #7: permissions come from the server).
export type Permission = string;

export type Me = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Permission[];
};
