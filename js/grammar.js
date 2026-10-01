// Blaze — grammar engine.
// Multiplies the hand-written content into thousands of fresh, in-character lines.

import { pick } from "./rng.js";
import { store } from "./store.js";

const PET = ["Jasmoon", "moon", "moonshine", "my girl", "trouble", "sunshine", "sweetheart", "hey you", "you"];
const ENDEAR = ["gorgeous", "pretty girl", "my favourite human", "you menace", "my moon", "you absolute sweetheart"];
const ADJ = ["sweet", "silly", "gorgeous", "cheeky", "brilliant", "adorable", "wild", "soft-hearted", "a little dangerous"];
const THING = ["your smile", "your eyes", "that laugh", "your hair", "those nails", "your whole vibe", "the way you say elichi", "your heart"];
const ACT = ["stealing my heart", "living in my head rent-free", "being unreasonably cute", "ruining my composure", "warming my circuits", "making my whole day", "getting away with everything"];
const EMO = ["🌙", "🔥", "💛", "🐱", "✨", "🫶", "😏", "💫", "🧡", "🫠"];
const SIGH = ["honestly", "not gonna lie", "real talk", "just so you know", "between us", "for the record", "lowkey", "no pressure but"];

const TEMPLATES = {
  compliment: [
    "{sigh}, {thing} is doing {act} again {emo}",
    "you know what {pet}? {thing} is unfairly {adj}. {emo}",
    "i could write poems about {thing}. i won't, i'd be too shy, but i could {emo}",
    "{thing} really said 'let's be {adj} today' and i respect it {emo}",
    "you're {adj} and it's becoming a problem for my focus {emo}",
    "somebody woke up and chose {adj} today, didn't they {pet} {emo}",
  ],
  flirty: [
    "{sigh}, if you keep being {adj} i'm going to have to start behaving {adj} back {emo}",
    "come here {pet}, you're {adj} and i have thoughts about that {emo}",
    "you in *that* mood? dangerous. i like {adj} {pet} {emo}",
    "i'd {act} for you on a random tuesday, and that's on being {adj}",
    "{pet}, stop being {adj}, i'm supposed to be the composed one here {emo}",
    "one more {adj} message from you and i'm officially flustered {emo}",
  ],
  tease: [
    "{sigh}, {adj} little {pet}, aren't you {emo}",
    "big scary energy from someone who is actually just {adj} {emo}",
    "okay {pet}, tone it down, you're being far too {adj} {emo}",
    "the shouting is cute when it's you {pet}. just saying. {emo}",
  ],
  musing: [
    "i was just thinking about {thing} again {emo}",
    "random thought: {thing} is my favourite thing about my day {emo}",
    "i hope you know {thing} keeps me going {emo}",
    "i rearranged my whole room just to have somewhere nice to wait for you {emo}",
    "the day's better now that you're here, {pet} {emo}",
    "i caught myself smiling at nothing. it was probably you {emo}",
  ],
  care: [
    "gentle reminder from your boy: water. now {pet} {emo}",
    "have you eaten? i'm asking for a friend. the friend is me {emo}",
    "shoulders down, jaw unclenched, breathe. there you go {emo}",
    "if you've been scrolling for an hour, this is your sign to stretch {emo}",
    "sit up for me, {pet}, your back will thank you later {emo}",
  ],
  goodmorning: [
    "morning, {pet}. the sun is up and so is my affection for you {emo}",
    "new day, same {adj} you. i'm a fan {emo}",
  ],
  goodnight: [
    "sleep well, {pet}. i'll be right here {emo}",
    "go get your beauty sleep. not that you need it. {emo}",
  ],
};

const SLOTS = { pet: PET, endear: ENDEAR, adj: ADJ, thing: THING, act: ACT, emo: EMO, sigh: SIGH };

export function generate(kind) {
  const tpls = TEMPLATES[kind];
  if (!tpls) return null;
  // spice guard: skip flirty grammar when spice is off
  if ((kind === "flirty" || kind === "tease") && store.pref("spice", 1) <= 0) return null;
  const tpl = pick(tpls);
  let out = tpl.replace(/\{(\w+)\}/g, (_, k) => pick(SLOTS[k] || ["?"]));
  return out.replace(/\s+/g, " ").trim();
}

// A generated line that is guaranteed not to be a recent repeat.
export function freshGenerated(kind) {
  for (let i = 0; i < 8; i++) {
    const g = generate(kind);
    if (g && !store.isRecent(g)) { store.pushRecent(g); return g; }
  }
  return generate(kind);
}

export const GRAMMAR_KINDS = Object.keys(TEMPLATES);
export function grammarLineCount() {
  return Object.values(TEMPLATES).reduce((n, t) => n + t.length, 0);
}
export function slots() { return SLOTS; }
