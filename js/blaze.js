// Blaze — the little guy himself. Mood, movement, gestures.

const MOODS = ["idle", "happy", "love", "think", "surprised", "sad", "sleepy", "smug", "shy"];

class Blaze {
  constructor() {
    this.el = document.getElementById("blaze");
    this.heartsEl = document.getElementById("hearts");
    this.el.style.left = "50%";
    this.mood = "idle";
    this.actions = new Set();
    this.dir = 1;
    this.x = 50;
    this.walkTimer = null;
    this._startLoops();
    this.apply();
  }

  apply() {
    this.el.setAttribute("class", "blaze " + ["mood-" + this.mood, ...this.actions].join(" "));
  }

  setMood(m, hold = 0) {
    if (!MOODS.includes(m)) m = "idle";
    this.mood = m;
    this.apply();
    if (this._moodTimer) clearTimeout(this._moodTimer);
    if (hold) this._moodTimer = setTimeout(() => this.setMood("idle"), hold);
  }

  action(name, ms) {
    this.actions.add(name);
    this.apply();
    setTimeout(() => { this.actions.delete(name); this.apply(); }, ms);
  }

  wave() { this.action("wave", 1400); }
  jump() { this.action("jump", 620); }
  bounce() { this.action("jump", 620); setTimeout(() => this.action("jump", 620), 640); }
  dance() { this.action("dance", 2600); }

  // Walk to a horizontal position (percent of scene width).
  walk(toX, speed = 3.4) {
    toX = Math.max(12, Math.min(88, toX));
    if (Math.abs(toX - this.x) < 3) return;
    this.dir = toX < this.x ? -1 : 1;
    const dist = Math.abs(toX - this.x);
    const dur = Math.max(600, (dist / speed) * 1000);
    this.actions.add("walking");
    this.el.style.left = toX + "%";
    this.apply();
    if (this.walkTimer) clearTimeout(this.walkTimer);
    this.walkTimer = setTimeout(() => {
      this.actions.delete("walking");
      this.x = toX;
      this.apply();
    }, dur);
    this.x = toX;
  }

  // Face a direction without walking.
  face(dir) { this.dir = dir; }

  _startLoops() {
    // blink
    const blink = () => {
      if (this.mood === "sleepy" || this.mood === "sad") { setTimeout(blink, 1500); return; }
      this.action("blink", 190);
      setTimeout(blink, 2200 + Math.random() * 3800);
    };
    setTimeout(blink, 1200);

    // subtle gaze
    const gaze = () => {
      if (!["sleepy", "sad", "surprised"].includes(this.mood)) {
        const dx = (Math.random() * 4 - 2).toFixed(1);
        const dy = (Math.random() * 3 - 1).toFixed(1);
        document.querySelectorAll(".iris,.pupil").forEach((p) => {
          p.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      }
      setTimeout(gaze, 900 + Math.random() * 1600);
    };
    setTimeout(gaze, 800);
  }

  spawnHearts(n = 6) {
    if (!this.heartsEl) return;
    if (window.__blazeNoFx) return;
    const glyphs = ["💛", "🧡", "💕", "🌙", "✨"];
    const rect = this.el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const h = document.createElement("div");
      h.className = "heart";
      h.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      h.style.left = (rect.left + rect.width * (0.3 + Math.random() * 0.4)) + "px";
      h.style.top = (rect.top + rect.height * 0.25) + "px";
      h.style.animationDelay = (Math.random() * 0.4) + "s";
      this.heartsEl.appendChild(h);
      setTimeout(() => h.remove(), 2400);
    }
  }

  spawnZzz() {
    if (!this.heartsEl || window.__blazeNoFx) return;
    const rect = this.el.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      const z = document.createElement("div");
      z.className = "heart";
      z.textContent = "z";
      z.style.fontWeight = "800";
      z.style.color = "#cbb7ff";
      z.style.left = (rect.left + rect.width * 0.6) + "px";
      z.style.top = (rect.top + rect.height * 0.2) + "px";
      z.style.animationDelay = (i * 0.4) + "s";
      this.heartsEl.appendChild(z);
      setTimeout(() => z.remove(), 2600);
    }
  }

  react(kind) {
    switch (kind) {
      case "wave": this.wave(); break;
      case "jump": this.jump(); break;
      case "bounce": this.bounce(); break;
      case "dance": this.dance(); break;
      case "hearts": this.spawnHearts(7); break;
      case "hug": this.action("wave", 900); this.spawnHearts(9); break;
      case "sleep": this.spawnZzz(); break;
    }
  }
}

export const blaze = new Blaze();

// ---------------- time of day ----------------
export function applyTimeOfDay() {
  const h = new Date().getHours();
  const night = h >= 19 || h < 6;
  document.body.classList.toggle("night", night);
  document.body.classList.toggle("day", !night);
  const celestial = document.getElementById("celestial");
  if (celestial) {
    if (night) { celestial.style.left = "22%"; celestial.style.top = "22%"; }
    else {
      const t = (h - 6) / 12; // 0..1 across the day
      celestial.style.left = (12 + t * 72) + "%";
      celestial.style.top = (56 - Math.sin(Math.PI * t) * 42) + "%";
    }
  }
}
