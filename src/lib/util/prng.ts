/** Creates a deterministic mulberry32 pseudo-random number generator. */
export function createPrng(seed: number): () => number {
  let state = seed >>> 0;

  return (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Returns an integer in the inclusive range from min through max. */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Returns one item selected from a non-empty array. */
export function pick<T>(rng: () => number, values: readonly T[]): T {
  if (values.length === 0) {
    throw new Error("Cannot pick from an empty array");
  }

  return values[Math.floor(rng() * values.length)]!;
}
