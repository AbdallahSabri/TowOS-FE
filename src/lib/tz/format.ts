// The one formatter in the app that's allowed to touch Intl.DateTimeFormat
// (FE-SPEC.md §9, enforced by the local/no-toLocale-outside-tz lint rule).
// Every timestamp displays in the *job's* timezone, never the viewer's —
// there is no "current locale" branch here on purpose.
//
// dateStyle/timeStyle can't be combined with an explicit `timeZoneName`
// option per the Intl spec (they're mutually exclusive option families), so
// the label requires spelling out each field instead of using a style
// preset.

export type FormatInJobTimezoneOptions = {
  /** Omit the year, e.g. for a board where every job is the current year. */
  includeYear?: boolean;
};

/**
 * Formats a UTC instant in a job's service timezone, labeled with that
 * zone's abbreviation (e.g. "Jan 15, 2026, 2:00 PM CST").
 *
 * @param instant A UTC instant — an ISO 8601 string or a Date.
 * @param serviceTimezone The job's IANA timezone, e.g. "America/Chicago".
 */
export function formatInJobTimezone(
  instant: Date | string,
  serviceTimezone: string,
  options: FormatInJobTimezoneOptions = {},
): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;

  if (Number.isNaN(date.getTime())) {
    throw new Error(`formatInJobTimezone: "${instant}" is not a valid instant.`);
  }

  const { includeYear = true } = options;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: serviceTimezone,
    ...(includeYear ? { year: "numeric" } : {}),
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
