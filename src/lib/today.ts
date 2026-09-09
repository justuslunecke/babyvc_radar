/**
 * The demo dataset is static, so "now" is pinned. Everything that computes
 * "3 days ago" or "closes in 12 days" reads this, so the whole app tells one
 * consistent story. Swap for `new Date()` when the data goes live.
 */
export const TODAY = new Date("2026-09-09T00:00:00Z");
