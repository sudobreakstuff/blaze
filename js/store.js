// Blaze — persistent memory (per browser, localStorage).
// Everything Blaze "remembers" about Jasmine lives here.

const KEY = "blaze.v1";

// Safe in the browser and in Node (for the content tools).
const storage = (typeof localStorage !== "undefined")
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const DEFAULTS = {
  facts: {},                 // learned: {name_of_pet: "Rex", loves: ["nails"], ...}
  affection: 0,              // relationship meter, grows with interaction
  visits: 0,
  firstSeen: null,
  lastSeen: null,
  streak: 0,
  lastDay: null,             // YYYY-MM-DD of last visit
  lastSeenToday: false,
  prefs: {
    voice: true,
    voiceURI: null,
    notify: false,
    mic: false,
    spice: 1.0,              // 0 = sweet, 1 = flirty, 2 = extra
    effects: true,
  },
  recent: [],                // rolling ledger of recently-spoken lines (anti-repeat)
  history: [],               // last ~40 {who,text,ts}
  blazeMood: "idle",
  lastGreetDay: null,        // day we already did the good-morning for
  lastStoryDay: null,
  notes: [],                 // things she asked Blaze to remember
};

let state = load();

function load() {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULTS), parsed);
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function deepMerge(base, over) {
  for (const k of Object.keys(over || {})) {
    const v = over[k];
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      base[k] = deepMerge(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { storage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, 120);
}

export const store = {
  get data() { return state; },

  get(k, d = undefined) { return state[k] === undefined ? d : state[k]; },
  set(k, v) { state[k] = v; save(); },
  update(fn) { fn(state); save(); },

  pref(k, d = undefined) { return state.prefs[k] === undefined ? d : state.prefs[k]; },
  setPref(k, v) { state.prefs[k] = v; save(); },

  // ---- relationship ----
  addAffection(n = 1) {
    state.affection = Math.max(0, state.affection + n);
    save();
  },
  affectionTier() {
    const a = state.affection;
    if (a < 8) return 0;      // new
    if (a < 30) return 1;     // warming up
    if (a < 80) return 2;     // close
    if (a < 180) return 3;    // smitten
    return 4;                 // devoted
  },

  // ---- visits / streaks ----
  touchVisit() {
    const now = new Date();
    const day = dayKey(now);
    state.visits += 1;
    state.lastSeen = now.toISOString();
    if (!state.firstSeen) state.firstSeen = state.lastSeen;

    if (state.lastDay !== day) {
      const prev = state.lastDay ? new Date(state.lastDay + "T12:00:00") : null;
      const cur = new Date(day + "T12:00:00");
      if (prev && Math.round((cur - prev) / 86400000) === 1) state.streak += 1;
      else state.streak = 1;
      state.lastDay = day;
    }
    save();
    return { day, firstToday: state.lastGreetDay !== day, streak: state.streak };
  },
  markGreeted() { state.lastGreetDay = state.lastDay; save(); },

  daysSinceLastVisit() {
    if (!state.lastSeen) return 0;
    return Math.floor((Date.now() - new Date(state.lastSeen).getTime()) / 86400000);
  },
  hoursSinceLastVisit() {
    if (!state.lastSeen) return 0;
    return (Date.now() - new Date(state.lastSeen).getTime()) / 3600000;
  },

  // ---- learned facts ----
  learn(key, value) {
    state.facts[key] = value;
    save();
  },
  fact(key, d = undefined) { return state.facts[key] === undefined ? d : state.facts[key]; },
  remember(note) {
    if (!note) return;
    if (!state.notes.includes(note)) state.notes.unshift(note);
    state.notes = state.notes.slice(0, 25);
    save();
  },

  // ---- anti-repeat ledger ----
  hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return h.toString(36);
  },
  isRecent(line) { return state.recent.includes(this.hash(line)); },
  pushRecent(line) {
    state.recent.push(this.hash(line));
    if (state.recent.length > 220) state.recent.splice(0, state.recent.length - 220);
    save();
  },

  // ---- conversation history ----
  log(who, text) {
    state.history.push({ who, text, ts: Date.now() });
    if (state.history.length > 40) state.history.splice(0, state.history.length - 40);
    save();
  },

  reset() {
    state = structuredClone(DEFAULTS);
    try { storage.removeItem(KEY); } catch {}
    save();
  },
};

export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
