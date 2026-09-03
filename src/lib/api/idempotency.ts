// Generates and manages the Idempotency-Key attached to every mutation
// (FE-SPEC.md §6). The API rejects a POST without one.
//
// Ownership model: the client (this module) generates the ULID, but it's the
// *caller* that decides when a key is reused vs. regenerated — the client has
// no way to know whether a given call is a retry of the same user action or
// a brand new one. `useIdempotencyKey` holds the key across re-renders and
// retries of one action; call `reset()` only once that action has truly
// concluded (success, or the user abandons it) so the next distinct action
// gets a fresh key.

import { useState } from "react";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32, no I/L/O/U

function randomChar(): string {
  return ENCODING[Math.floor(Math.random() * ENCODING.length)];
}

/**
 * Generates a ULID: a 48-bit millisecond timestamp (10 Crockford base32
 * chars) followed by 80 bits of randomness (16 chars). Lexicographically
 * sortable by creation time; collision-resistant enough for an idempotency
 * key, which only needs uniqueness within one user action's retry window.
 */
export function generateIdempotencyKey(): string {
  let time = Date.now();
  const timeChars: string[] = [];
  for (let i = 0; i < 10; i++) {
    timeChars.unshift(ENCODING[time % 32]);
    time = Math.floor(time / 32);
  }

  const randomChars = Array.from({ length: 16 }, randomChar);

  return timeChars.join("") + randomChars.join("");
}

/**
 * Holds one Idempotency-Key stable across re-renders and repeated `mutate()`
 * calls for the same logical action. Call `reset()` after the action
 * concludes (success, or the user abandons it) to start the next action with
 * a fresh key — never reset just because a retry failed.
 */
export function useIdempotencyKey(): { key: string; reset: () => void } {
  const [key, setKey] = useState(generateIdempotencyKey);

  return {
    key,
    reset: () => setKey(generateIdempotencyKey()),
  };
}
