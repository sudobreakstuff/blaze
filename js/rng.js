// Blaze — small randomness helpers (no repeats, no boring).

import { store } from "./store.js";

export function pick(arr) {
  if (!arr || !arr.length) return null;
  return arr[(Math.random() * arr.length) | 0];
}

export function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function coin(p = 0.5) { return Math.random() < p; }
export function rint(min, max) { return min + ((Math.random() * (max - min + 1)) | 0); }
export function chance(pct) { return Math.random() * 100 < pct; }

// Weighted pick: items [{w, ...}] or parallel weights.
export function weighted(items, weightFn = (x) => x.w ?? 1) {
  let total = 0;
  for (const it of items) total += Math.max(0, weightFn(it));
  if (total <= 0) return pick(items);
  let r = Math.random() * total;
  for (const it of items) {
    r -= Math.max(0, weightFn(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// Shuffle-bag: hands out every item once before repeating, and skips anything
// still in the global recent-ledger when it can.
export function makeBag(getArray) {
  let bag = [];
  return function next() {
    const arr = getArray();
    if (!arr || !arr.length) return null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!bag.length) bag = shuffled(arr);
      const candidate = bag.pop();
      if (!store.isRecent(candidate)) { store.pushRecent(candidate); return candidate; }
      if (attempt === 2) { store.pushRecent(candidate); return candidate; }
    }
    return pick(arr);
  };
}

// Pick a line that isn't recent; falls back gracefully.
export function freshLine(arr) {
  if (!arr || !arr.length) return null;
  for (let i = 0; i < 6; i++) {
    const c = pick(arr);
    if (!store.isRecent(c)) { store.pushRecent(c); return c; }
  }
  const c = pick(arr);
  store.pushRecent(c);
  return c;
}

// Fill {slots} in a template string.
export function fill(template, slots) {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = slots[k];
    if (Array.isArray(v)) return pick(v);
    return v == null ? "" : v;
  });
}
