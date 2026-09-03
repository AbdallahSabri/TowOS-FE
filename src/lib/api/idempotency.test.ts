import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { generateIdempotencyKey, useIdempotencyKey } from "./idempotency";

describe("generateIdempotencyKey", () => {
  it("returns a 26-character Crockford base32 ULID", () => {
    expect(generateIdempotencyKey()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("returns a different key on each call", () => {
    expect(generateIdempotencyKey()).not.toBe(generateIdempotencyKey());
  });
});

describe("useIdempotencyKey", () => {
  it("keeps the same key across re-renders — reused across retries of one action (FE-SPEC.md §6)", () => {
    const { result, rerender } = renderHook(() => useIdempotencyKey());
    const firstKey = result.current.key;

    rerender();
    rerender();

    expect(result.current.key).toBe(firstKey);
  });

  it("issues a new key only once reset() is called", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const firstKey = result.current.key;

    act(() => {
      result.current.reset();
    });

    expect(result.current.key).not.toBe(firstKey);
  });
});
