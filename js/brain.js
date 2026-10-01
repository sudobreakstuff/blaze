// Blaze — autonomy. Keeps him alive, wandering and (gently) nudging.

import { store } from "./store.js";
import { dialogueState, autonomousBeats } from "./dialogue.js";
import { blaze } from "./blaze.js";
import { pick } from "./rng.js";

const BASE_TITLE = "blaze 🌙";
const NUDGE_TITLE = "🌙 blaze misses you";

class Brain {
  constructor() {
    this.onSay = () => {};
    this.onMood = () => {};
    this.lastInteraction = Date.now();
    this.nextAmbient = Date.now() + 9000;
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

    if (document.hidden) return;                 // don't talk to an empty room
    if (idleMs < 12000) return;                  // she's actively here
    if (dialogueState().mode === "story") return; // don't interrupt stories
    if (Date.now() < this.nextAmbient) return;

    const chat = store.pref("chattiness", 1);
    const mult = chat <= 0 ? 3.2 : chat >= 2 ? 0.5 : 1;

    // rare check-in after a long silence
    if (idleMs > 240000 && Math.random() < 0.4) {
      this.onSay({ beats: [{ text: pick(["you still there, moon? no pressure 🌙", "just checking you haven't been eaten by the support queue.", "i'm bored and you're my favourite person. no obligation."]), mood: "think", hearts: false }] });
      this.nextAmbient = Date.now() + 120000;
      return;
    }

    this.nextAmbient = Date.now() + (40000 + Math.random() * 80000) * mult;

    // sometimes he just stays quiet — makes him feel less mechanical
    if (Math.random() < 0.32) return;

    const a = autonomousBeats();
    if (a.greeting) store.markGreeted();
    if (a.silent) { if (a.action) blaze.react(a.action); return; }
    if (!a.beats || !a.beats.length) return;
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
