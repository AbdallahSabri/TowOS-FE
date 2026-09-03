// Maps API error codes to user-facing copy (FE-SPEC.md §6, §7.2).
//
// PLACEHOLDER: BE-SPEC.md's §7.2 error-code table isn't checked into this
// repo, so the codes below are a reasonable starter set, not the verified
// contract. When the real table is available, replace the contents of
// ERROR_COPY — nothing else in this file, or any caller, needs to change.

export type ApiErrorCode =
  | "SESSION_EXPIRED"
  | "PERMISSION_DENIED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | (string & {});

/**
 * Thrown by lib/api/client.ts for every failed request: a non-2xx response
 * (code taken from the envelope's error body) or a network failure that
 * never reached the server (code fixed to NETWORK_ERROR, status 0).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId?: string;

  constructor(params: { code: ApiErrorCode; status: number; requestId?: string; message?: string }) {
    super(params.message ?? mapErrorCodeToMessage(params.code));
    this.name = "ApiError";
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
  }
}

const ERROR_COPY: Record<string, string> = {
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  PERMISSION_DENIED: "You don't have permission to do that.",
  VALIDATION_ERROR: "Some of the information you entered isn't valid.",
  NOT_FOUND: "That couldn't be found. It may have been removed.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong on our end. Please try again.",
  NETWORK_ERROR: "Can't reach the server. Check your connection and try again.",
};

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/** Display copy for a code, falling back to a generic message for anything unmapped. */
export function mapErrorCodeToMessage(code: ApiErrorCode): string {
  return ERROR_COPY[code] ?? GENERIC_FALLBACK;
}

/** Display copy plus the request ID, for surfacing in a bug report. */
export function describeApiError(error: ApiError): string {
  const message = mapErrorCodeToMessage(error.code);
  return error.requestId ? `${message} (Request ID: ${error.requestId})` : message;
}
