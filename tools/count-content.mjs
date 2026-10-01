// Counts how much content Blaze actually has, and flags duplicates.
// Run: node tools/count-content.mjs
import { greetings } from "../content/greetings.js";
import { compliments } from "../content/compliments.js";
import { flirty } from "../content/flirty.js";
import { jokes } from "../content/jokes.js";
import { care } from "../content/care.js";
import { encourage } from "../content/encourage.js";
import { musings } from "../content/musings.js";
import { intentReplies, questionBanks, branches, pathReplies, pathOptions } from "../content/intents.js";
import { inside } from "../content/inside.js";
import { stories } from "../content/stories.js";
import { places, coupons, fortunes } from "../content/surprises.js";
import { GRAMMAR_KINDS, slots } from "../js/grammar.js";

const SKIP = new Set(["tags", "title"]);

function collect(node, out) {
  if (typeof node === "string") { out.push(node); return out; }
  if (Array.isArray(node)) { for (const n of node) collect(n, out); return out; }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) { if (!SKIP.has(k)) collect(v, out); }
  }
  return out;
}

const modules = {
  greetings, compliments, flirty, jokes, care, encourage, musings,
  intentReplies, questionBanks, branches, pathReplies, inside,
};

let total = 0;
const all = [];
console.log("blaze content report");
console.log("====================");
for (const [name, mod] of Object.entries(modules)) {
  const lines = collect(mod, []);
  total += lines.length;
  all.push(...lines);
  console.log(`  ${name.padEnd(16)} ${String(lines.length).padStart(5)}`);
}

// stories counted as parts + moral
const storyLines = [];
for (const s of stories) { storyLines.push(...s.parts); if (s.moral) storyLines.push(s.moral); }
total += storyLines.length;
all.push(...storyLines);
console.log(`  ${"stories".padEnd(16)} ${String(storyLines.length).padStart(5)}  (${stories.length} stories)`);

// surprises
const surpriseLines = [...places.map((p) => p.blurb), ...coupons.flatMap((c) => [c.title, c.text]), ...fortunes];
total += surpriseLines.length;
all.push(...surpriseLines);
console.log(`  ${"surprises".padEnd(16)} ${String(surpriseLines.length).padStart(5)}  (${places.length} places, ${coupons.length} coupons)`);

console.log("--------------------");
console.log(`  authored lines   ${String(total).padStart(5)}`);

// grammar potential
let potential = 0;
for (const kind of GRAMMAR_KINDS) {
  // approximate by counting slot combinations of the average template
  const sizes = Object.values(slots()).map((a) => a.length);
  const avgCombo = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  potential += Math.round(avgCombo * 3);
}
console.log(`  grammar variety  ~${potential} (slot combinations)`);
console.log(`  TOTAL potential  ~${total + potential}`);

// duplicates
const seen = new Map();
const dups = [];
for (const l of all) {
  const k = l.trim().toLowerCase();
  if (!k) continue;
  if (seen.has(k)) dups.push(l); else seen.set(k, true);
}
console.log("--------------------");
console.log(`  duplicate lines  ${dups.length}`);
if (dups.length) console.log("  e.g. " + dups.slice(0, 5).join(" | "));

const ok = total >= 1000;
console.log("====================");
console.log(ok ? "PASS: 1000+ authored lines." : "FAIL: under 1000 authored lines.");
process.exit(ok ? 0 : 1);
