// Design tokens for the job lifecycle, priority, and source badges
// (FE-SPEC.md §8). The colors themselves live as CSS custom properties in
// globals.css's @theme block; this file maps each domain enum's
// snake_case values (matching the API's likely field values) to the
// Tailwind utility class each one drives, so no component picks a color
// for a status, priority, or source by hand — and adding or renaming a
// value touches this file and globals.css only.
//
// Full utility class strings are exported (not fragments to interpolate)
// so Tailwind's source scanner can see them as literal candidates.

export const JOB_STATUSES = [
  "draft",
  "open",
  "assigned",
  "en_route",
  "on_scene",
  "complete",
  "cancelled",
  "expired",
  "goa",
  "unable_to_complete",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const jobStatusColorClass: Record<JobStatus, string> = {
  draft: "bg-status-draft",
  open: "bg-status-open",
  assigned: "bg-status-assigned",
  en_route: "bg-status-en-route",
  on_scene: "bg-status-on-scene",
  complete: "bg-status-complete",
  cancelled: "bg-status-cancelled",
  expired: "bg-status-expired",
  goa: "bg-status-goa",
  unable_to_complete: "bg-status-unable-to-complete",
};

// PLACEHOLDER: priority values themselves are blocked on FE-SPEC.md §15
// Q12 ([NEEDS TONY]). Only high/normal/low are confirmed.
export const PRIORITIES = ["high", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const priorityColorClass: Record<Priority, string> = {
  high: "bg-priority-high",
  normal: "bg-priority-normal",
  low: "bg-priority-low",
};

export const SOURCES = ["manual", "agero"] as const;
export type Source = (typeof SOURCES)[number];

export const sourceColorClass: Record<Source, string> = {
  manual: "bg-source-manual",
  agero: "bg-source-agero",
};

// Past-due state, rendered red (FE-SPEC.md §9.1). Not enum-keyed — it's a
// boolean condition (an aging indicator, per CLAUDE.md invariant #8, not a
// separate job status) layered on top of whatever status a job is already
// in.
export const pastDueColorClass = "text-past-due";
