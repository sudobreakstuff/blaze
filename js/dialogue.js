// Blaze — dialogue planner + conversation state machine.
// Decides *what to say and how*, given what Jasmine said and what he remembers.

import { analyze } from "./nlp.js";
import { store } from "./store.js";
import { freshLine, pick, coin, chance, rint } from "./rng.js";
import { freshGenerated } from "./grammar.js";
import { intentReplies, questionBanks, branches, pathOptions, pathReplies } from "../content/intents.js";
import { inside } from "../content/inside.js";
import { greetings } from "../content/greetings.js";
import { compliments } from "../content/compliments.js";
import { flirty } from "../content/flirty.js";
import { jokes } from "../content/jokes.js";
import { care } from "../content/care.js";
import { encourage } from "../content/encourage.js";
import { musings } from "../content/musings.js";
import { stories } from "../content/stories.js";
import { makeGift } from "../content/surprises.js";

const S = {
  mode: "idle",              // idle | problem | await_path | story | distract | plan
  topic: null,
  pending: null,             // null | "detail" | "path" | "branch"
  lastIntent: null,
  lastEmotion: null,
  turns: 0,
  story: null,
  storyIdx: 0,
  lastUtterance: "",
};

export function dialogueState() { return { ...S }; }

function beat(text, mood, opts = {}) {
  return { text, mood: mood || "idle", hearts: opts.hearts || false, action: opts.action || null, delay: opts.delay || 0 };
}

function spiceLevel() { return store.pref("spice", 1); }
function tier() { return store.affectionTier(); }

// Choose a curated-or-generated line of a kind, respecting spice.
function complimentLine() {
  const pool = [
    ...compliments.looks, ...compliments.personality, ...compliments.effort,
    ...(tier() >= 2 ? compliments.girly : []), ...compliments.general,
  ];
  const g = freshGenerated("compliment");
  return coin(0.45) && g ? g : freshLine(pool);
}
function flirtyLine(poolKey) {
  if (spiceLevel() <= 0) return null;
  const pools = flirty[poolKey] || flirty.general;
  const g = freshGenerated(poolKey === "onMessages" ? "flirty" : "flirty");
  return coin(0.4) && g ? g : freshLine(pools);
}
function careLine(key) { return freshLine(care[key]); }
function encourageLine(key) { return freshLine(encourage[key] || encourage.general); }

// ---------- greeting ----------
export function greetingLine(now, firstToday, days) {
  const h = now.getHours();
  let pool;
  if (days >= 2) pool = greetings.returning;
  else if (h < 5) pool = greetings.night;
  else if (h < 12) pool = greetings.morning;
  else if (h < 17) pool = greetings.afternoon;
  else if (h < 22) pool = greetings.evening;
  else pool = greetings.night;

  const beats = [beat(freshLine(pool), h < 12 ? "happy" : "happy", { hearts: chance(30), action: "wave" })];
  const st = store.get("streak", 0);
  if (firstToday && days === 0 && st >= 3 && chance(60)) {
    beats.push(beat(`${st} days in a row now, ${pick(["moon", "Jasmoon", "trouble"])}. i'm keeping count 😏`, "smug"));
  }
  return beats;
}

// ---------- main response ----------
export function respondTo(raw) {
  const a = analyze(raw);
  S.turns += 1;
  S.lastUtterance = raw;

  // learn anything worth keeping
  applyFacts(a.facts);

  const beats = [];

  // ===== story continuation =====
  if (S.mode === "story" && S.story) {
    return continueStory();
  }

  // ===== she's answering the "which path?" question =====
  if (S.pending === "path") {
    const p = matchPath(a.norm.text);
    if (p) { S.pending = null; return runPath(p, a); }
    // fall through if it's clearly a new problem
  }

  // ===== she's giving detail about the problem =====
  if (S.pending === "branch" && S.topic) {
    const earlyPath = matchPath(a.norm.text);
    if (earlyPath) { S.pending = null; return runPath(earlyPath, a); }
    const b = classifyBranch(S.topic, a);
    const lines = branches[S.topic]?.[b] || branches[S.topic]?.general || encourage.general;
    S.pending = "path";
    const out = [beat(empathize(a), a.emotion === "sad" ? "sad" : "shy")];
    out.push(beat(freshLine(lines), "smug"));
    out.push(beat("what do you want to do — " + pathOptions.slice(0, 4).join(", ") + "?", "idle"));
    return { beats: out, offering: pathOptions.slice(0, 4), mood: "think" };
  }

  // ===== inside jokes & shout handling (always win) =====
  if (a.norm.text.includes("elichi")) {
    return { beats: [beat(freshLine(inside.elichi), "happy", { hearts: true, action: "bounce" })], mood: "happy" };
  }
  if (a.norm.text.includes("jasmoon")) {
    // she brought it up — Blaze beams
    return { beats: [beat(freshLine(inside.jasmoon), "love", { hearts: true })], mood: "love" };
  }
  const tenderIntents = ["love", "good_news", "sad", "anxious", "tired", "stressed", "sick", "lonely", "breakup", "period"];
  if (a.shout && !tenderIntents.includes(a.intent) && a.valence > -0.3) {
    const b = [beat(freshLine(inside.shout), "surprised", { action: "jump" })];
    if (coin(0.4)) b.push(beat("okay, real talk — what happened?", "think"));
    return { beats: b, mood: "surprised" };
  }

  // ===== direct requests =====
  switch (a.intent) {
    case "compliment_me":
      return { beats: [beat(complimentLine(), "love", { hearts: true })], mood: "love" };
    case "joke":
      return jokeBeats();
    case "story":
    case "story_time":
      return startStory(a.topic || "general");
    case "sing":
      return { beats: [beat(freshLine(intentReplies.sing), "happy", { action: "dance" })], mood: "happy" };
    case "dance":
      return { beats: [beat(freshLine(intentReplies.dance), "happy", { action: "dance" })], mood: "happy" };
    case "hug":
      return { beats: [beat(freshLine(intentReplies.hug), "love", { hearts: true, action: "hug" })], mood: "love" };
    case "kiss":
      return { beats: [beat(freshLine(intentReplies.kiss), "love", { hearts: true })], mood: "love" };
    case "flirt":
      return { beats: [beat(flirtyLine("general") || "i'm always flirty with you, that's just my face.", "love", { hearts: true })], mood: "love" };
    case "surprise":
      return surpriseBeats();
    case "ask_name":
    case "abilities":
      return { beats: [beat(freshLine(intentReplies[a.intent]), "happy", { hearts: a.intent === "ask_name" })], mood: "happy" };
  }

  // ===== affection / sweet =====
  if (["love", "miss", "compliment_give"].includes(a.intent) || (a.emotion === "love" && a.valence > 0.4)) {
    const m = a.intent === "love" ? "love" : "love";
    const line = a.intent === "love" ? freshLine(flirty.onMessages.love) : freshLine(intentReplies[a.intent] || compliments.general);
    store.addAffection(2);
    const b = [beat(line, m, { hearts: true })];
    if (chance(35) && tier() >= 2) b.push(beat(pick(["i like you. a lot. that's the whole update 🌙", "you've got me, in case that wasn't obvious.", "whatever this is, i'm in it."]), "love", { hearts: true }));
    return { beats: b, mood: m };
  }

  // ===== negative / problem → start "let's sort it out" =====
  const heavy = ["sad", "angry", "anxious", "stressed", "lonely", "breakup", "selfimage", "bad_news", "relationship", "family", "money", "work", "jenny", "friend", "mood"].includes(a.intent)
    || ["sad", "angry", "anxious", "tired"].includes(a.emotion)
    || (a.valence < -0.35 && a.topic);
  if (heavy && a.intent !== "tired") {
    const topic = pickTopic(a);
    S.mode = "problem";
    S.topic = topic;
    S.pending = "branch";
    S.lastEmotion = a.emotion;
    const opener = empathize(a);
    const q = freshLine(questionBanks[topic] || questionBanks.general);
    return { beats: [beat(opener, moodForEmotion(a.emotion), { hearts: a.intent === "breakup" })], mood: moodForEmotion(a.emotion), followUp: [beat(q, "think")], pending: "branch", topic };
  }

  // ===== tired / comfort =====
  if (a.intent === "tired" || a.emotion === "tired") {
    const b = [beat(freshLine(intentReplies.tired), "sleepy")];
    if (chance(50)) b.push(beat(careLine(pick(["sleep", "tired", "breakReminder"])), "sleepy"));
    return { beats: b, mood: "sleepy" };
  }
  if (["sick", "period", "sleep_help", "hungry", "bored", "no", "yes", "thanks", "sorry", "insult_playful", "remember", "advice", "decide", "question", "weather", "time", "girly", "study", "good_news"].includes(a.intent)) {
    const b = [beat(freshLine(intentReplies[a.intent] || encourage.general), moodForIntent(a.intent))];
    if (a.intent === "good_news") return { beats: b, mood: "happy", hearts: true };
    if (a.intent === "sick" || a.intent === "period") { b.push(beat(careLine(a.intent === "period" ? "period" : "sick"), "sleepy")); return { beats: b, mood: "sleepy" }; }
    if (a.intent === "study") { return { beats: b, mood: "think", followUp: [beat(freshLine(questionBanks.study), "think")], pending: "branch", topic: "study" }; }
    if (a.intent === "bored") { return { beats: b, mood: "happy", offering: ["tell me a joke", "story time", "let's chat"] }; }
    if (a.intent === "advice" || a.intent === "decide") { return { beats: b, mood: "think", followUp: [beat("what's the choice, exactly? lay it out and we'll weigh it.", "think")], pending: "branch", topic: "mood" }; }
    return { beats: b, mood: moodForIntent(a.intent) };
  }

  // ===== plain chat intents =====
  if (intentReplies[a.intent] && a.intent !== "unknown") {
    return { beats: [beat(freshLine(intentReplies[a.intent]), moodForIntent(a.intent))], mood: moodForIntent(a.intent) };
  }

  // ===== question without a mapped answer =====
  if (a.question) {
    return { beats: [beat(freshLine(intentReplies.question), "think")], mood: "think" };
  }

  // ===== fallback — keep her talking =====
  const fb = [beat(freshLine(intentReplies.unknown), "idle")];
  if (chance(30)) fb.push(beat(freshLine(musings.questions), "happy"));
  return { beats: fb, mood: "idle" };
}

// ---------- paths ----------
function matchPath(text) {
  if (/talk|vent|hear me|listen/.test(text)) return "talk it out";
  if (/plan|solve|fix|step|organis|organiz/.test(text)) return "let's make a plan";
  if (/story|tale/.test(text)) return "story time";
  if (/distract|something else|forget|cheer/.test(text)) return "just distract me";
  if (/better|okay now|fine now|thank/.test(text)) return "i feel better now";
  return null;
}

function runPath(path, a) {
  switch (path) {
    case "story time":
      return startStory(S.topic || "general");
    case "just distract me": {
      const seq = [beat(freshLine(pathReplies["just distract me"]), "happy")];
      if (coin(0.6)) seq.push(...jokeBeats().beats);
      else seq.push(beat(freshLine(musings.playful), "smug"));
      S.mode = "idle"; S.pending = null;
      return { beats: seq, mood: "happy" };
    }
    case "i feel better now": {
      S.mode = "idle"; S.pending = null;
      store.addAffection(3);
      return { beats: [beat(freshLine(pathReplies["i feel better now"]), "love", { hearts: true }), beat(complimentLine(), "love", { hearts: true })], mood: "love" };
    }
    case "let's make a plan": {
      S.mode = "plan";
      return { beats: [beat(freshLine(pathReplies["let's make a plan"]), "think"), beat(planStep(S.topic), "think")], mood: "think", pending: "branch", topic: S.topic };
    }
    default: {
      // talk it out
      return { beats: [beat(freshLine(pathReplies["talk it out"]), "shy"), beat(freshLine(questionBanks[S.topic] || questionBanks.general), "think")], mood: "think", pending: "branch", topic: S.topic };
    }
  }
}

function planStep(topic) {
  const steps = {
    work: "step one: write down everything on your plate. step two: circle the one thing only you can do. the rest can wait or be delegated.",
    jenny: "step one: survive the next call. step two: note anything a manager should know about. step three: clock out hard.",
    love: "step one: decide what you actually want. step two: tell him once, clearly. step three: believe what he does next.",
    money: "step one: list the real numbers, no panic. step two: find the one leak. step three: fix only that this week.",
    study: "step one: split the topic into three chunks. step two: do chunk one for 25 minutes. step three: reward yourself.",
    mood: "step one: name the feeling. step two: name one thing that would help, however small. step three: do the small thing.",
  };
  return steps[topic] || "step one: say the problem out loud. step two: split it into what you control and what you don't. step three: act only on the first pile.";
}

// ---------- stories ----------
function startStory(topic) {
  const pool = stories.filter((s) => s.tags.includes(topic));
  const list = pool.length ? pool : stories;
  const story = pick(list);
  S.mode = "story";
  S.story = story;
  S.storyIdx = 0;
  S.lastStory = story.title;
  store.set("lastStoryDay", new Date().toDateString());
  const beats = [beat("okay, story time. this one's for you 🌙", "happy")];
  // first two parts now; rest continue on later messages
  beats.push(beat(story.parts[0], "idle"));
  if (story.parts[1]) { beats.push(beat(story.parts[1], "idle")); S.storyIdx = 2; }
  else S.storyIdx = 1;
  if (S.storyIdx < story.parts.length) S.mode = "story";
  else finishStory(beats);
  return { beats, mood: "idle" };
}

function continueStory() {
  const story = S.story;
  const beats = [];
  const remaining = story.parts.length - S.storyIdx;
  const take = Math.min(remaining, 2);
  for (let i = 0; i < take; i++) { beats.push(beat(story.parts[S.storyIdx], "idle")); S.storyIdx += 1; }
  if (S.storyIdx >= story.parts.length) finishStory(beats);
  else beats.push(beat("...", "think"));
  return { beats, mood: "idle" };
}

function finishStory(beats) {
  beats.push(beat("the moral, since i know you love these: " + S.story.moral, "happy", { hearts: true }));
  S.mode = "idle"; S.story = null; S.storyIdx = 0; S.pending = null;
  store.addAffection(2);
}

// ---------- jokes ----------
export function jokeBeats() {
  if (coin(0.28) && jokes.twoPart.length) {
    const [setup, punch] = pick(jokes.twoPart);
    return { beats: [beat(setup, "smug"), beat(punch, "happy", { hearts: chance(30) })], mood: "happy" };
  }
  const pool = [...jokes.oneLiners, ...jokes.silly, ...jokes.flirtJokes, ...(chance(40) ? jokes.officeLife : [])];
  return { beats: [beat(freshLine(pool), "happy", { action: chance(40) ? "bounce" : null })], mood: "happy" };
}

// ---------- surprises ----------
export function surpriseBeats() {
  const g = makeGift(pick(["moon", "Jasmoon", "gorgeous", "trouble"]));
  return { beats: [beat(freshLine(intentReplies.surprise), "happy", { action: "bounce" })], gift: g, mood: "happy" };
}

// ---------- autonomous (no input) ----------
export function autonomousBeats() {
  const now = new Date();
  const h = now.getHours();
  const firstToday = store.get("lastGreetDay") !== new Date().toDateString();
  const days = store.daysSinceLastVisit();

  if (firstToday && store.hoursSinceLastVisit() < 1) {
    return { beats: greetingLine(now, true, days), greeting: true };
  }

  const roll = Math.random();
  // sometimes he just does something, no words
  if (roll < 0.24) return { beats: [], silent: true, action: pick(["dance", "jump", "wave", "bounce"]) };
  // rare spontaneous gift
  if (roll < 0.31) return surpriseBeats();

  let line;
  const r = Math.random();
  if (h >= 22 || h < 5) line = pick([...musings.lateNight, ...musings.thoughtsOfHer]);
  else if (r < 0.15) line = freshLine(musings.questions);
  else if (r < 0.4) line = freshLine(musings.thoughtsOfHer);
  else if (r < 0.58) line = freshGenerated("musing") || freshLine(musings.observations);
  else if (r < 0.72) line = careLine(pick(["water", "checkin", "breakReminder", "food"]));
  else if (r < 0.86) line = complimentLine();
  else if (spiceLevel() > 0) line = flirtyLine("general");
  else line = freshLine([...musings.observations, ...musings.playful, ...musings.callbacks]);

  const mood = /water|eat|break|sleep/.test(line || "") ? "shy" : /think|wonder|hope/.test(line || "") ? "think" : "idle";
  return { beats: [beat(line, mood, { hearts: chance(15) })], greeting: false };
}

// ---------- helpers ----------
function applyFacts(facts) {
  for (const [k, v] of Object.entries(facts || {})) {
    if (k === "__note") { store.remember(typeof v === "string" ? v : String(v)); continue; }
    store.learn(k, v);
  }
}

function pickTopic(a) {
  if (a.topics.includes("work") || a.topics.includes("jenny")) return a.topics.includes("jenny") ? "jenny" : "work";
  if (a.topics.includes("love")) return "love";
  if (a.topics.includes("family")) return "family";
  if (a.topics.includes("friends")) return "friends";
  if (a.topics.includes("money")) return "money";
  if (a.topics.includes("health")) return "health";
  if (a.topics.includes("body")) return "body";
  if (a.topics.includes("girly")) return "girly";
  if (a.topics.includes("study")) return "study";
  if (a.topics.includes("mood")) return "mood";
  return "general";
}

function empathize(a) {
  const pools = {
    work: encourage.work, jenny: intentReplies.jenny, love: encourage.love, family: intentReplies.family,
    friends: intentReplies.friend, money: encourage.money, health: care.sick, body: encourage.selfimage,
    selfimage: encourage.selfimage, mood: care.comfort, study: encourage.study, breakup: intentReplies.breakup,
    relationship: intentReplies.relationship, general: encourage.general,
  };
  const pool = pools[a.topics[0]] || pools[a.intent] || pools.general;
  return freshLine(pool || encourage.general);
}

function classifyBranch(topic, a) {
  const t = a.norm.text;
  if (topic === "work") {
    if (/boss|manager|supervisor|hr/.test(t)) return "boss";
    if (/customer|client|call|rude|angry/.test(t)) return "customers";
    if (/pay|salary|money|raise|underpaid/.test(t)) return "pay";
    if (/hour|shift|late|overtime|weekend/.test(t)) return "hours";
    if (/coworker|colleague|gossip|team/.test(t)) return "coworkers";
    return "workload";
  }
  if (topic === "love" || topic === "relationship") {
    if (/broke up|dumped|over|ex\b/.test(t)) return "heartbreak";
    if (/fight|argue|argument|shouted|said/.test(t)) return "argument";
    if (/far|distance|busy|away|long/.test(t)) return "distance";
    if (/crush|like him|butterflies/.test(t)) return "crush";
    return "uncertainty";
  }
  if (topic === "mood") {
    if (/sad|cry|down|empty|depress/.test(t)) return "sad";
    if (/angry|mad|furious|frustrat/.test(t)) return "angry";
    if (/anxious|worried|scared|panic|nerv/.test(t)) return "anxious";
    if (/lonely|alone/.test(t)) return "lonely";
    return "general";
  }
  return null;
}

function moodForEmotion(e) {
  return { sad: "sad", angry: "surprised", anxious: "shy", tired: "sleepy", happy: "happy", love: "love", affectionate: "love", neutral: "idle" }[e] || "idle";
}
function moodForIntent(i) {
  const m = { greet: "happy", goodbye: "shy", love: "love", miss: "love", thanks: "happy", sorry: "shy", yes: "happy", no: "smug",
    compliment_give: "shy", insult_playful: "smug", sing: "happy", dance: "happy", hug: "love", kiss: "love", flirt: "love",
    hungry: "think", bored: "happy", angry: "surprised", anxious: "shy", stressed: "think", tired: "sleepy", sleep_help: "sleepy",
    sick: "sleepy", lonely: "sad", work: "think", jenny: "think", boss: "smug", money: "think", family: "shy", friend: "think",
    relationship: "shy", breakup: "sad", selfimage: "sad", girly: "happy", period: "sleepy", study: "think", weather: "idle",
    time: "idle", remember: "smug", advice: "think", question: "think", good_news: "happy", bad_news: "sad", unknown: "idle" };
  return m[i] || "idle";
}

export function resetDialogue() { S.mode = "idle"; S.topic = null; S.pending = null; S.story = null; S.storyIdx = 0; S.turns = 0; }
