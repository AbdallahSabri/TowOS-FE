// Fetch wrapper for the TowOS API (FE-SPEC.md §6). Highest-blast-radius file
// in this repo (CLAUDE.md) — every screen's data and every mutation goes
// through here.
//
// - Every request sends credentials: 'include'. No token ever touches
//   localStorage/sessionStorage/a cookie this app sets (CLAUDE.md #6).
// - The { data, meta, request_id } envelope is unwrapped here; callers only
//   ever see `data`'s contents.
// - Every failure — a non-2xx response or a network failure that never
//   reached the server — becomes an ApiError. No retry happens in this file;
//   TanStack Query owns retry counts (§7: 1 for reads, 0 for writes).
// - 401 is deliberately normalized to SESSION_EXPIRED regardless of what the
//   body says, because the global cache-clear-and-redirect in
//   lib/query/provider.tsx keys off exactly that (§6: "A 401 or
//   SESSION_EXPIRED clears the query cache and redirects to login").
//
// Mutations (post/patch/del) require an Idempotency-Key argument — generate
// one with lib/api/idempotency.ts. There's no default so it's structurally
// impossible to forget one.

import { ApiError, type ApiErrorCode } from "./errors";

type Envelope<T> = {
  data: T;
  meta?: unknown;
  request_id?: string;
};

type ErrorEnvelope = {
  error?: { code?: string; message?: string };
  request_id?: string;
};

function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  return url;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    // Never reached the server: offline, DNS failure, CORS, timeout, etc.
    // Not a session problem, so no cache clear or redirect — the caller's
    // query/mutation just fails predictably and can show a retry affordance.
    throw new ApiError({ code: "NETWORK_ERROR", status: 0 });
  }

  const body = await parseJsonBody(response);

  if (!response.ok) {
    const errorBody = body as ErrorEnvelope | undefined;
    const code: ApiErrorCode =
      response.status === 401 ? "SESSION_EXPIRED" : (errorBody?.error?.code ?? "INTERNAL_ERROR");

    throw new ApiError({
      code,
      status: response.status,
      requestId: errorBody?.request_id,
      message: errorBody?.error?.message,
    });
  }

  return (body as Envelope<T>).data;
}

export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: "GET" });
}

export function apiPost<T>(
  path: string,
  body: unknown,
  idempotencyKey: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "POST",
    body: JSON.stringify(body),
    headers: { ...init?.headers, "Idempotency-Key": idempotencyKey },
  });
}

export function apiPatch<T>(
  path: string,
  body: unknown,
  idempotencyKey: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { ...init?.headers, "Idempotency-Key": idempotencyKey },
  });
}

export function apiDelete<T>(path: string, idempotencyKey: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "DELETE",
    headers: { ...init?.headers, "Idempotency-Key": idempotencyKey },
  });
}

export { ApiError } from "./errors";
