import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "./client";

function mockFetchOnce(response: { status: number; body: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => response.body,
  });
}

describe("api client (FE-SPEC.md §6)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("unwraps the envelope so the caller only ever sees data's contents", async () => {
    global.fetch = mockFetchOnce({ status: 200, body: { data: { id: "1" }, request_id: "r1" } });

    await expect(apiGet<{ id: string }>("/things/1")).resolves.toEqual({ id: "1" });
  });

  it("sends credentials: 'include' and attaches the given Idempotency-Key on a mutation", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: { data: null, request_id: "r2" } });
    global.fetch = fetchMock;

    await apiPost("/things", { name: "a" }, "test-key-123");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(init.credentials).toBe("include");
    expect(init.headers["Idempotency-Key"]).toBe("test-key-123");
  });

  it("reuses the same Idempotency-Key across a retried call for the same action", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: { data: null, request_id: "r2" } });
    global.fetch = fetchMock;

    await apiPost("/things", { name: "a" }, "same-key");
    await apiPost("/things", { name: "a" }, "same-key");

    const firstHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(firstHeaders["Idempotency-Key"]).toBe(secondHeaders["Idempotency-Key"]);
  });

  it("normalizes a 401 to SESSION_EXPIRED regardless of what the response body says", async () => {
    global.fetch = mockFetchOnce({
      status: 401,
      body: { error: { code: "SOMETHING_ELSE" }, request_id: "r3" },
    });

    await expect(apiGet("/auth/me")).rejects.toMatchObject({
      code: "SESSION_EXPIRED",
      status: 401,
      requestId: "r3",
    });
  });

  it("maps a non-401 error code straight through from the response body", async () => {
    global.fetch = mockFetchOnce({
      status: 403,
      body: { error: { code: "PERMISSION_DENIED" }, request_id: "r4" },
    });

    await expect(apiGet("/things/1")).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
      status: 403,
      requestId: "r4",
    });
  });

  it("falls back to INTERNAL_ERROR when a non-2xx response has no error code", async () => {
    global.fetch = mockFetchOnce({ status: 500, body: {} });

    await expect(apiGet("/things/1")).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      status: 500,
    });
  });

  it("wraps a network failure as NETWORK_ERROR and does not retry it itself", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    global.fetch = fetchMock;

    await expect(apiGet("/things/1")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
