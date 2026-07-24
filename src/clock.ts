/** A small, injectable clock seam for timestamps and expiry decisions. */
let readClock: () => number = () => Date.now();

export function now(): number {
  return readClock();
}

/** Test hook. Production code always uses the system clock. */
export function setClockForTests(clock?: () => number): void {
  readClock = clock ?? (() => Date.now());
}
