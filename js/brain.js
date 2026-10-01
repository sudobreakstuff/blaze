// Blaze — autonomy. Keeps him alive, wandering and (gently) nudging.

import { store } from "./store.js";
import { dialogueState, autonomousBeats } from "./dialogue.js";
import { blaze } from "./blaze.js";

const BASE_TITLE = "blaze 🌙";
const NUDGE_TITLE = "🌙 blaze misses you";

class Brain {
  constructor() {
    this.onSay = () => {};
    this.onMood = () => {};
    this.lastInteraction = Date.now();
    this.nextAmbient = Date.now() + 6000;
    this.enabled = true;
    this._titleTimer = null;
    this._nudged = false;
    this._idleCheck = 0;
    this.mood = "idle";
  }

  start({ onSay, onMood }) {
    this.onSay = onSay || this.onSay;
    this.onMood = onMood || this.onMood;
    setInterval(() => this._tick(), 4000);
    document.addEventListener("visibilitychange", () => this._onVisibility());
    window.addEventListener("pointerdown", () => this.touch());
    window.addEventListener("keydown", () => this.touch());
  }

  touch() { this.lastInteraction = Date.now(); }
  pause() { this.enabled = false; }
  resume() { this.enabled = true; this.lastInteraction = Date.now(); }

  _onVisibility() {
    if (document.hidden) this._startTitleNudge();
    else { this._stopTitleNudge(); this.touch(); }
  }

  _startTitleNudge() {
    if (!this.enabled) return;
    let flip = false;
    this._stopTitleNudge();
    this._titleTimer = setInterval(() => {
      flip = !flip;
      document.title = flip ? NUDGE_TITLE : BASE_TITLE;
    }, 2600);
    document.title = NUDGE_TITLE;
  }
  _stopTitleNudge() {
    if (this._titleTimer) clearInterval(this._titleTimer);
    this._titleTimer = null;
    document.title = BASE_TITLE;
  }

  _tick() {
    if (!this.enabled) return;
    const idleMs = Date.now() - this.lastInteraction;

    // occasional mood drift when idle
    if (idleMs > 45000 && Math.random() < 0.25) {
      const m = ["think", "smug", "shy", "idle", "happy"][(Math.random() * 5) | 0];
      this.onMood(m);
    }

    if (document.hidden) return;           // don't talk to an empty room
    if (idleMs < 9000) return;             // she's actively here
    if (dialogueState().mode === "story") return; // don't interrupt stories
    if (Date.now() < this.nextAmbient) return;

    // if she's gone quiet for a long stretch, check in
    if (idleMs > 150000 && Math.random() < 0.5) {
      this.onSay({ beats: [{ text: "you still there, moon? no pressure. i'm just nosy 🌙", mood: "think", hearts: false }] });
      this.nextAmbient = Date.now() + 90000;
      return;
    }

    this.nextAmbient = Date.now() + 14000 + Math.random() * 26000;
    const a = autonomousBeats();
    if (a.greeting) store.markGreeted();
    this.onSay(a);
  }

  // ---- notifications ----
  async requestNotify() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const p = await Notification.requestPermission();
    return p === "granted";
  }

  notify(line) {
    if (!store.pref("notify", false)) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const n = new Notification("Blaze 🌙", { body: line, tag: "blaze", silent: false });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {}
  }

  maybeNudge(text) {
    if (store.pref("notify", false)) this.notify(text);
    else if (document.hidden) this._startTitleNudge();
  }
}

export const brain = new Brain();
