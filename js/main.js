// Blaze — boot, chat wiring, voice, photo wall, gifts, settings.

import { store } from "./store.js";
import { blaze, applyTimeOfDay } from "./blaze.js";
import { brain } from "./brain.js";
import { analyze } from "./nlp.js";
import { respondTo, greetingLine } from "./dialogue.js";
import { photos } from "./photos.js";
import { pick } from "./rng.js";

const params = new URLSearchParams(location.search);
const FAST = params.has("fast");
const DEBUG = params.has("debug");
window.__blazeNoFx = store.pref("effects", true) === false;

const $ = (id) => document.getElementById(id);
const messagesEl = $("messages"), inputEl = $("input"), quickEl = $("quick"), bubbleEl = $("bubble"), bubbleText = $("bubble-text");
const moodLabel = $("mood-label"), debugEl = $("debug");

const DEFAULT_QUICK = ["tell me a joke", "compliment me 💛", "surprise me 🎁", "how are you?"];

let bubbleTimer = null;

// ---------------- startup ----------------
function boot() {
  applyTimeOfDay();
  setInterval(applyTimeOfDay, 60000);
  makeLights();

  store.touchVisit();
  syncPrefs();

  photos.init($("photowall"), {
    onChange: (added, count, kind) => {
      if (added > 0) {
        emit({ text: pick([
          "oh you put one up! i love it. i've been staring at it, respectfully. 🥹",
          "new photo on the wall 🌙 i'm going to look at it way too often, just so you know.",
          "look at that. our wall's getting full. i like it here already.",
          "you added a picture! i've decided it's my favourite. don't tell the others.",
        ]), mood: "happy", hearts: true });
        blaze.spawnHearts(8);
      } else if (kind === "clear") {
        emit({ text: "okay, clean wall. send me some more when you're ready 💛", mood: "shy" });
      }
    },
    onNote: (t) => emit({ text: t, mood: "shy" }),
  });

  brain.start({
    onSay: (a) => {
      if (a.greeting) store.markGreeted();
      playBeats(a.beats, { autonomous: true, notify: a.greeting || false }).then(() => { if (a.gift) renderGift(a.gift); });
    },
    onMood: (m) => blaze.setMood(m),
  });

  if (store.get("visits", 1) <= 1) {
    store.markGreeted();
    playBeats([{ text: "oh — hi! i'm Blaze 🌙 i've been waiting to meet you.", mood: "happy", action: "wave" }], { autonomous: true });
    setTimeout(() => playBeats([{ text: "shahid may have mentioned you. he absolutely under-sold it.", mood: "smug" }], { autonomous: true }), 2600);
  } else {
    const days = store.daysSinceLastVisit();
    const firstToday = store.get("lastGreetDay") !== new Date().toDateString();
    if (firstToday || days >= 1) {
      store.markGreeted();
      setTimeout(() => playBeats(greetingLine(new Date(), true, days), { autonomous: true }), 900);
    }
  }

  renderQuick(DEFAULT_QUICK);
  if (DEBUG) debugEl.hidden = false;

  $("composer").addEventListener("submit", (e) => { e.preventDefault(); send(inputEl.value); });
  $("btn-mic").addEventListener("click", toggleMic);
  $("btn-settings").addEventListener("click", () => { $("settings").hidden = false; updateFactCount(); populateVoices(); });
  $("btn-close-settings").addEventListener("click", () => { $("settings").hidden = true; });
  $("btn-forget").addEventListener("click", () => {
    if (confirm("Make Blaze forget everything he knows about you? (You can't undo this.)")) {
      store.reset(); syncPrefs(); clearMessages(); updateFactCount();
      emit({ text: "okay... clean slate. but i already like you again.", mood: "shy" });
    }
  });

  // photos
  $("btn-add-photos").addEventListener("click", () => $("photo-input").click());
  $("photo-input").addEventListener("change", async (e) => { await photos.addFiles(e.target.files); e.target.value = ""; });
  $("btn-gallery").addEventListener("click", () => photos.openGallery());
  $("btn-open-gallery").addEventListener("click", () => { $("settings").hidden = true; photos.openGallery(); });
  $("photowall").addEventListener("click", () => { if (photos.count() === 0) $("photo-input").click(); });
  setupDropZone();
  $("blaze").addEventListener("click", petBlaze);

  // room light switch
  $("light-switch").textContent = LIGHT_ICON[store.pref("lightMode", "auto")] || "🌗";
  $("light-switch").addEventListener("click", cycleLight);

  ["voice", "mic", "notify", "effects"].forEach((k) => {
    $("pref-" + k).addEventListener("change", async (e) => {
      store.setPref(k, e.target.checked);
      if (k === "notify" && e.target.checked) {
        const ok = await brain.requestNotify();
        if (!ok) { e.target.checked = false; store.setPref("notify", false); emit({ text: "notifications are blocked by the browser, moon. it's okay — i'll just talk here.", mood: "shy" }); }
      }
      if (k === "effects") window.__blazeNoFx = !e.target.checked;
    });
  });
  $("pref-spice").addEventListener("input", (e) => store.setPref("spice", Number(e.target.value)));
  $("pref-chattiness").addEventListener("input", (e) => store.setPref("chattiness", Number(e.target.value)));
  $("pref-voicepick").addEventListener("change", (e) => { store.setPref("voiceURI", e.target.value); speak("hey moon, how's this one?"); });
  $("pref-pitch").addEventListener("input", (e) => store.setPref("pitch", Number(e.target.value)));
  $("pref-rate").addEventListener("input", (e) => store.setPref("rate", Number(e.target.value)));
  $("pref-pitch").addEventListener("change", () => speak("is this better, moon?"));
  $("pref-rate").addEventListener("change", () => speak("is this better, moon?"));
  $("btn-test-voice").addEventListener("click", () => speak("hey moon, it's me. just checking my voice sounds okay."));

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("settings").hidden = true; });
  inputEl.addEventListener("focus", () => brain.touch());

  maybeVoiceHint();
}

function maybeVoiceHint() {
  setTimeout(() => {
    if (store.pref("voiceHintShown", false) || !store.pref("voice", true)) return;
    const v = pickBestVoice();
    const poor = !v || /espeak|compact|robot/i.test(v.name) || v.localService !== false;
    if (poor) {
      store.setPref("voiceHintShown", true);
      emit({ text: "psst — if my voice sounds robotic, that's the browser's fault, not mine. ⚙ → voice has a link to install a proper one.", mood: "shy" });
    }
  }, 7000);
}

function makeLights() {
  const el = $("lights"); if (!el) return;
  for (let i = 0; i < 12; i++) { const s = document.createElement("i"); s.style.left = (3 + i * 8.4) + "%"; el.appendChild(s); }
}

const LIGHT_ICON = { auto: "🌗", day: "☀️", night: "🌙" };
function cycleLight() {
  const order = ["auto", "day", "night"];
  const cur = store.pref("lightMode", "auto");
  const next = order[(order.indexOf(cur) + 1) % order.length];
  store.setPref("lightMode", next);
  applyTimeOfDay();
  const btn = $("light-switch");
  btn.textContent = LIGHT_ICON[next];
  btn.title = "room light: " + next + " (tap to change)";
  brain.touch();
}

let lastPet = 0;
function petBlaze() {
  const now = Date.now();
  if (now - lastPet < 900) return;
  lastPet = now;
  brain.touch();
  store.addAffection(1);
  blaze.react("hug");
  blaze.setMood("love", 2600);
  blaze.spawnHearts(6);
  if (FAST || Math.random() < 0.5) {
    emit({ text: pick([
      "hehe. okay. i like that.",
      "careful, i get attached.",
      "oh! more. i mean — that's enough. (more.)",
      "you can't just poke me and expect me to be normal about it.",
      "fine. i'm yours. you already knew that.",
      "that's the spot, moon 🌙",
      "warn me next time. i'm fragile and extremely fond of you.",
    ]), mood: "love", hearts: true, action: "bounce" });
  }
}

let dragDepth = 0;
function setupDropZone() {
  const scene = $("scene");
  scene.addEventListener("dragenter", (e) => { e.preventDefault(); dragDepth++; scene.classList.add("dragover"); });
  scene.addEventListener("dragover", (e) => { e.preventDefault(); });
  scene.addEventListener("dragleave", () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) scene.classList.remove("dragover"); });
  scene.addEventListener("drop", (e) => {
    e.preventDefault(); dragDepth = 0; scene.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files) photos.addFiles(e.dataTransfer.files);
  });
}

// ---------------- prefs <-> UI ----------------
function syncPrefs() {
  $("pref-voice").checked = store.pref("voice", true);
  $("pref-mic").checked = store.pref("mic", false);
  $("pref-notify").checked = store.pref("notify", false);
  $("pref-effects").checked = store.pref("effects", true);
  $("pref-spice").value = store.pref("spice", 1);
  $("pref-chattiness").value = store.pref("chattiness", 1);
  $("pref-pitch").value = store.pref("pitch", 0.9);
  $("pref-rate").value = store.pref("rate", 0.97);
  updateFactCount();
}

function updateFactCount() {
  const n = Object.keys(store.get("facts", {})).length + (store.get("notes", []).length || 0);
  const el = $("fact-count"); if (el) el.textContent = String(n);
}

// ---------------- sending ----------------
async function send(text) {
  text = (text || "").trim();
  if (!text) return;
  brain.touch();
  inputEl.value = "";
  addMessage("her", text);
  store.log("her", text);
  renderQuick([]);
  showTyping();
  await wait(FAST ? 200 : 420 + Math.min(800, text.length * 15));
  removeTyping();

  let res;
  try { res = respondTo(text); } catch (err) { console.error(err); res = { beats: [{ text: "my brain glitched for a second there. say that again?", mood: "think" }] }; }
  if (DEBUG) { const a = analyze(text); debugEl.textContent = JSON.stringify({ intent: a.intent, alt: a.altIntents, emotion: a.emotion, valence: +a.valence.toFixed(2), shout: a.shout, topics: a.topics, pending: res.pending || null, topic: res.topic || null, facts: a.facts }, null, 1); }

  await playBeats(res.beats);
  if (res.followUp) await playBeats(res.followUp);
  if (res.gift) { await wait(200); renderGift(res.gift); }

  if (res.offering) renderQuick(res.offering);
  else renderQuick(DEFAULT_QUICK);
  updateFactCount();
}

// ---------------- playing beats ----------------
async function playBeats(beats, opts = {}) {
  if (!beats || !beats.length) return;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    if (i > 0) { showTyping(); await wait(FAST ? 120 : 480 + b.text.length * 10); removeTyping(); }
    emit(b, opts);
    await wait(FAST ? 120 : Math.min(2400, 650 + b.text.length * 22));
  }
}

function emit(b, opts = {}) {
  if (!b) return;
  blaze.setMood(b.mood || "idle", 6000);
  if (b.action) blaze.react(b.action);
  if (b.hearts) blaze.spawnHearts(7);
  if (b.mood === "sleepy") blaze.spawnZzz();
  moodLabel.textContent = "is " + moodWord(b.mood);
  addMessage("blaze", b.text);
  showBubble(b.text);
  store.log("blaze", b.text);
  if (store.pref("voice", true) && !opts.silent) speak(b.text);
  if (opts.notify) brain.maybeNudge(b.text);
}

// ---------------- gifts ----------------
function renderGift(g) {
  if (!g) return;
  const d = document.createElement("div");
  d.className = "gift";
  let html = `<div class="gift-tag">${esc(g.tag || "a gift")}</div>`;
  if (g.title) html += `<div class="gift-title">${esc(g.title)}</div>`;
  if (g.text) html += `<div class="gift-text">${esc(g.text).replace(/\n/g, "<br>")}</div>`;
  if (g.kind === "doodle" && g.svg) html += `<div class="gift-doodle">${g.svg}</div>`;
  if (g.url) html += `<a class="gift-link" href="${g.url}" target="_blank" rel="noopener noreferrer">take me there ↗</a>`;
  d.innerHTML = html;
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  blaze.spawnHearts(6);
}
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// ---------------- bubbles & messages ----------------
function showBubble(text) {
  bubbleText.textContent = text;
  bubbleEl.hidden = false;
  bubbleEl.style.animation = "none"; void bubbleEl.offsetWidth; bubbleEl.style.animation = "";
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { bubbleEl.hidden = true; }, Math.min(8500, 2400 + text.length * 50));
}

function addMessage(who, text) {
  const d = document.createElement("div");
  d.className = "msg " + (who === "blaze" ? "from-blaze" : who === "her" ? "her" : "sys");
  d.textContent = text;
  const t = document.createElement("span");
  t.className = "stamp";
  t.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  d.appendChild(t);
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function clearMessages() { messagesEl.innerHTML = ""; }

let typingEl = null;
function showTyping() {
  if (typingEl) return;
  typingEl = document.createElement("div");
  typingEl.className = "msg from-blaze typing";
  typingEl.innerHTML = 'blaze is thinking<span class="d">.</span><span class="d">.</span><span class="d">.</span>';
  messagesEl.appendChild(typingEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function removeTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

function renderQuick(items) {
  quickEl.innerHTML = "";
  (items || []).forEach((label) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    b.addEventListener("click", () => send(label.replace(/[💛🎁🌙]/g, "").trim()));
    quickEl.appendChild(b);
  });
}

function moodWord(m) {
  return { idle: "around", happy: "happy", love: "smitten", think: "thinking", surprised: "surprised", sad: "soft", sleepy: "sleepy", smug: "smug", shy: "shy" }[m] || "around";
}
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// ---------------- voice ----------------
let voices = [];
const FEMALE_HINTS = ["female", "zira", "hazel", "samantha", "karen", "moira", "tessa", "victoria", "fiona", "susan", "serena", "maria", "anna", "linda", "heather", "emily", "amelie", "joanna", "salli", "kendra", "kimberly", "ivy", "raveena", "catherine", "sonia", "natasha", "aria", "jenny", "michelle", "google uk english female", "google us english"];
const MALE_HINTS = ["male", "david", "mark", "guy", "george", "james", "daniel", "alex", "fred", "tom", "ryan", "oliver", "arthur", "liam", "sean", "brian", "matthew", "christopher", "eric", "paul", "richard", "thomas", "william", "rishi", "yuri", "dmitri", "en-gb-wls", "m3", "m4", "m5", "m6", "m7"];
const QUALITY = [["natural", 60], ["neural", 60], ["piper", 55], ["wavenet", 45], ["google", 40], ["online", 36], ["siri", 32], ["cloud", 30], ["premium", 28], ["enhanced", 28], ["multilingual", 20], ["compact", -22], ["espeak", -26], ["robot", -20]];

function gender(v) {
  const n = (v.name + " " + (v.voiceURI || "")).toLowerCase();
  if (FEMALE_HINTS.some((h) => n.includes(h))) return "f";
  if (MALE_HINTS.some((h) => n.includes(h))) return "m";
  return "?";
}
function voiceScore(v) {
  const n = (v.name + " " + (v.voiceURI || "")).toLowerCase();
  let s = 0;
  if (/^en/i.test(v.lang)) s += 12;
  if (/en-(gb|za|au|nz)/i.test(v.lang)) s += 8;
  s += gender(v) === "m" ? 60 : gender(v) === "f" ? -30 : 0;
  for (const [k, w] of QUALITY) if (n.includes(k)) s += w;
  if (v.localService === false) s += 18;
  return s;
}
function pickBestVoice() { return voices.length ? voices.slice().sort((a, b) => voiceScore(b) - voiceScore(a))[0] : null; }

function populateVoices() {
  voices = (window.speechSynthesis?.getVoices?.() || []);
  const sel = $("pref-voicepick");
  const wanted = store.pref("voiceURI");
  sel.innerHTML = '<option value="">auto (Blaze picks the best guy voice)</option>';
  voices.slice().sort((a, b) => voiceScore(b) - voiceScore(a)).forEach((v) => {
    const o = document.createElement("option");
    o.value = v.voiceURI;
    o.textContent = `${gender(v) === "m" ? "♂" : gender(v) === "f" ? "♀" : "•"} ${v.name} (${v.lang})`;
    if (v.voiceURI === wanted) o.selected = true;
    sel.appendChild(o);
  });
}
if (window.speechSynthesis) { populateVoices(); speechSynthesis.onvoiceschanged = populateVoices; }

function stripSpeech(text) {
  return String(text)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/[#*_`>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function speak(text) {
  if (!window.speechSynthesis) return;
  const clean = stripSpeech(text);
  if (!clean) return;
  const parts = (clean.match(/[^.!?…]+[.!?…]?/g) || [clean]).map((s) => s.trim()).filter(Boolean);

  const wanted = store.pref("voiceURI");
  let voice = wanted ? voices.find((v) => v.voiceURI === wanted) : null;
  if (!voice) voice = pickBestVoice();

  const basePitch = Number(store.pref("pitch", 0.9));
  const baseRate = Number(store.pref("rate", 0.97));

  try { speechSynthesis.cancel(); } catch {}
  let i = 0;
  const next = () => {
    if (i >= parts.length) return;
    const p = parts[i++];
    const u = new SpeechSynthesisUtterance(p);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-GB";
    u.rate = clamp(baseRate + (Math.random() * 0.05 - 0.02), 0.6, 1.4);
    u.pitch = clamp(basePitch + (Math.random() * 0.06 - 0.03), 0.4, 1.6);
    u.volume = 1;
    u.onend = () => setTimeout(next, 110 + (/[,;:]$/.test(p) ? 70 : 0) + (p.length > 70 ? 80 : 0));
    try { speechSynthesis.speak(u); } catch {}
  };
  next();
}

// ---------------- mic ----------------
let recognizer = null;
function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = $("btn-mic");
  if (!SR) { emit({ text: "your browser won't let me listen, moon. typing works just fine 💛", mood: "shy" }); return; }
  if (recognizer) { recognizer.stop(); recognizer = null; btn.classList.remove("listening"); return; }
  recognizer = new SR();
  recognizer.lang = "en-GB";
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  btn.classList.add("listening");
  recognizer.onresult = (e) => { const t = e.results[0][0].transcript; btn.classList.remove("listening"); recognizer = null; send(t); };
  recognizer.onerror = () => { btn.classList.remove("listening"); recognizer = null; emit({ text: "i didn't catch that. try again?", mood: "think" }); };
  recognizer.onend = () => btn.classList.remove("listening");
  try { recognizer.start(); } catch {}
}

boot();

window.blazeDebug = { respondTo, analyze, store, photos };
