import { describe, expect, it } from "vitest";
import { ApiError, describeApiError, mapErrorCodeToMessage } from "./errors";

describe("mapErrorCodeToMessage", () => {
  it("maps a known code to its display copy", () => {
    expect(mapErrorCodeToMessage("SESSION_EXPIRED")).toMatch(/session has expired/i);
  });

  it("falls back to a generic message for an unmapped code (FE-SPEC.md §14)", () => {
    expect(mapErrorCodeToMessage("SOME_FUTURE_CODE_NOT_YET_SEEN")).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("describeApiError", () => {
  it("includes the request ID so it can be quoted in a bug report", () => {
    const error = new ApiError({ code: "INTERNAL_ERROR", status: 500, requestId: "req_abc123" });
    expect(describeApiError(error)).toContain("req_abc123");
  });

  it("omits the request ID segment when there isn't one", () => {
    const error = new ApiError({ code: "INTERNAL_ERROR", status: 500 });
    expect(describeApiError(error)).not.toContain("Request ID");
  });
});
