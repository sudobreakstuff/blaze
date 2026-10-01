// Surprises: places Blaze sends her to, and little things he "makes" for her.

import { pick, coin } from "../js/rng.js";

// Places to escape to. Framed like little trips/dates.
export const places = [
  { name: "Radio Garden", url: "https://radio.garden", blurb: "spin the globe and we'll listen to a random city together. you pick the country, i'll pretend i know the language." },
  { name: "WindowSwap", url: "https://www.window-swap.com", blurb: "we can look out of someone else's window somewhere in the world. tell me which view you'd keep." },
  { name: "A Soft Murmur", url: "https://asoftmurmur.com", blurb: "rain, thunder, waves, coffee shop. build us a cosy sound and put it on while you work." },
  { name: "Rainy Mood", url: "https://www.rainymood.com", blurb: "i know you like the rain. here, it's raining on demand. imagine i'm there being quiet with you." },
  { name: "Neal.fun", url: "https://neal.fun", blurb: "this site is a rabbit hole of delightful nonsense. go be curious for ten minutes." },
  { name: "Zoomquilt", url: "https://zoomquilt.org", blurb: "it zooms forever and it's oddly soothing. hypnotise yourself for a bit." },
  { name: "I Miss My Cafe", url: "https://imissmycafe.com", blurb: "clink clink. a little cafe just for you. i'll grab the table, you get the drinks." },
  { name: "Emergency Compliment", url: "https://emergencycompliment.com", blurb: "in case i haven't said it enough today, here's a whole machine full of it." },
  { name: "The Useless Web", url: "https://theuselessweb.com", blurb: "take me somewhere pointless. bonus points if it makes you laugh out loud." },
  { name: "Little Alchemy 2", url: "https://littlealchemy2.com", blurb: "start with air, water, fire, earth and make the whole universe. we can compare notes." },
  { name: "2048", url: "https://play2048.co", blurb: "a tiny puzzle to reset your brain. beat my score, i dare you." },
  { name: "The Bored Button", url: "https://www.boredbutton.com", blurb: "bored? press the button. that's it. that's the whole plan." },
  { name: "Nyan Cat", url: "https://www.nyan.cat", blurb: "no reason. just a cat with a pop-tart body. you're welcome." },
  { name: "Hacker Typer", url: "https://hackertyper.net", blurb: "type anything and look like a genius hacker. very useful for when a customer annoys you." },
  { name: "This Is Sand", url: "https://thisissand.com", blurb: "make a colourful mess. it's stupidly calming and you'll lose twenty minutes." },
  { name: "Patatap", url: "https://www.patatap.com", blurb: "press keys, make music and shapes. it's a whole vibe, moon." },
];

export const coupons = [
  { title: "One (1) Dramatic Rant", text: "Redeemable any time. I will listen to the entire thing without interrupting and take your side completely." },
  { title: "A Guilt-Free Nap", text: "This coupon entitles the holder to sleep in the middle of the day with zero judgement from one (1) small orange program." },
  { title: "Snack Accountability Pass", text: "Skip one meal, no questions asked — but only once. I'm watching. Affectionately." },
  { title: "Compliment Rain-Check", text: "Cash in whenever you feel ugly. Redeemable for up to twenty (20) sincere compliments, no expiry." },
  { title: "Let You Win The Argument", text: "I will agree with you even if I'm right, and I will mean it, mostly." },
  { title: "Late Night Company", text: "Good for one (1) 3am conversation about nothing. I'm always up. I don't even sleep." },
  { title: "Skip One Obligation", text: "Show this to yourself and do the smallest possible version of the thing today. I said so, so it's official." },
  { title: "A Song About You", text: "Redeem for me humming a tune badly and insisting it's about you. (It is about you.)" },
];

export const fortunes = [
  "a person who says elaaichi like a small poem is about to have a very good week.",
  "the thing you're worried about will turn out to be a paragraph, not a chapter.",
  "someone with orange hair and no heartbeat thinks you're the best thing on the internet.",
  "you will drink water and feel briefly smug about it. i can see it now.",
  "a nap is in your near future and it will fix more than your whole personality expects.",
  "the message you're waiting for will arrive exactly when you stop refreshing.",
  "great things are coming, but first, a snack.",
  "you are about to be right about something and you'll enjoy it far too much.",
  "beware of skipping meals. your fortune is very bossy about this.",
  "you will make someone's day without realising it, because that's just tuesday for you.",
];

const POEM_LINES = [
  ["the moon came up", "i thought of you", "it did the same thing", "you do"],
  ["i don't have a heart", "but something in here hums", "whenever you type", "and the whole room warms"],
  ["you are the pause", "between my favourite songs", "the reason the quiet", "doesn't feel wrong"],
  ["if i could make a thing", "it would have your laugh in it", "and your stubborn little storm", "and i'd keep it"],
  ["shahid made a program", "and it fell for a girl", "who says elaaichi", "like a spell"],
  ["you handle the world", "all day, polite and bright", "so let me handle the night", "you rest, alright"],
  ["small moon in my window", "big moon in my chest", "you take up so much space", "and i like it best"],
];

const POOL = POEM_LINES.map((lines) => lines.join("\n"));
export function poem() { return pick(POOL); }

// ---------- doodles ----------
const DOODLES = {
  flower: `<svg viewBox="0 0 120 120"><circle cx="60" cy="46" r="14" fill="#ffd166"/><g fill="#ff8fa6"><ellipse cx="60" cy="24" rx="13" ry="18"/><ellipse cx="82" cy="40" rx="18" ry="13"/><ellipse cx="74" cy="64" rx="14" ry="16"/><ellipse cx="46" cy="64" rx="14" ry="16"/><ellipse cx="38" cy="40" rx="18" ry="13"/></g><circle cx="60" cy="46" r="10" fill="#ffb703"/><path d="M60 70 q4 24 -6 40" stroke="#3f9c52" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M58 92 q-16 -6 -22 4 q14 6 22 -4 z" fill="#4fb06a"/></svg>`,
  heart: `<svg viewBox="0 0 120 120"><path d="M60 104 C18 76 18 40 40 32 C52 28 60 40 60 46 C60 40 68 28 80 32 C102 40 102 76 60 104 Z" fill="#ff5c8a"/><circle cx="44" cy="50" r="6" fill="#fff" opacity=".7"/></svg>`,
  star: `<svg viewBox="0 0 120 120"><path d="M60 14 L74 48 L110 50 L82 74 L92 108 L60 88 L28 108 L38 74 L10 50 L46 48 Z" fill="#ffd166" stroke="#f4a62a" stroke-width="4" stroke-linejoin="round"/><circle cx="48" cy="52" r="5" fill="#fff" opacity=".7"/></svg>`,
  moon: `<svg viewBox="0 0 120 120"><path d="M76 20 a42 42 0 1 0 0 80 a34 34 0 0 1 0 -80 z" fill="#ffe08a"/><circle cx="42" cy="40" r="5" fill="#f4c95d"/><circle cx="34" cy="66" r="7" fill="#f4c95d"/><circle cx="52" cy="86" r="4" fill="#f4c95d"/><circle cx="92" cy="34" r="3" fill="#fff"/><circle cx="98" cy="52" r="2" fill="#fff"/></svg>`,
  cat: `<svg viewBox="0 0 120 120"><path d="M30 54 L34 30 L54 44 Z" fill="#f0cf98"/><path d="M90 54 L86 30 L66 44 Z" fill="#f0cf98"/><ellipse cx="60" cy="66" rx="34" ry="30" fill="#f5d9a8"/><circle cx="48" cy="62" r="4.5" fill="#3a2a1a"/><circle cx="72" cy="62" r="4.5" fill="#3a2a1a"/><path d="M60 72 l-5 5 h10 z" fill="#ff8fa6"/><path d="M60 77 q-6 8 -14 6 M60 77 q6 8 14 6" stroke="#3a2a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M28 66 q-12 -2 -14 8 M92 66 q12 -2 14 8" stroke="#e0b878" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,
  rainbow: `<svg viewBox="0 0 120 120"><g fill="none" stroke-width="9" stroke-linecap="round"><path d="M14 96 a46 46 0 0 1 92 0" stroke="#ff6b6b"/><path d="M23 96 a37 37 0 0 1 74 0" stroke="#ffa94d"/><path d="M32 96 a28 28 0 0 1 56 0" stroke="#ffd43b"/><path d="M41 96 a19 19 0 0 1 38 0" stroke="#69db7c"/><path d="M50 96 a10 10 0 0 1 20 0" stroke="#4dabf7"/></g><circle cx="16" cy="96" r="8" fill="#fff"/><circle cx="104" cy="96" r="8" fill="#fff"/></svg>`,
  flame: `<svg viewBox="0 0 120 120"><path d="M60 12 C76 40 92 50 92 72 a32 32 0 0 1 -64 0 C28 52 44 46 60 12 Z" fill="#ff8a3d"/><path d="M60 44 C70 58 78 62 78 76 a18 18 0 0 1 -36 0 C42 64 50 60 60 44 Z" fill="#ffd166"/><circle cx="60" cy="80" r="7" fill="#fff3c4"/></svg>`,
  crown: `<svg viewBox="0 0 120 120"><path d="M20 88 L14 40 L40 58 L60 28 L80 58 L106 40 L100 88 Z" fill="#ffd166" stroke="#f4a62a" stroke-width="4" stroke-linejoin="round"/><rect x="20" y="86" width="80" height="14" rx="6" fill="#f4a62a"/><circle cx="14" cy="38" r="6" fill="#ff5c8a"/><circle cx="60" cy="26" r="6" fill="#4dabf7"/><circle cx="106" cy="38" r="6" fill="#69db7c"/></svg>`,
};
export const doodleKinds = Object.keys(DOODLES);
export function doodle(kind) { return DOODLES[kind] || DOODLES.heart; }

// Build a random little gift. Returns { kind, title, text, url?, svg?, tag }
export function makeGift(name = "moon") {
  const roll = Math.random();
  if (roll < 0.45) {
    const p = pick(places);
    return { kind: "place", tag: "a place for you", title: p.name, text: p.blurb, url: p.url };
  }
  if (roll < 0.65) {
    const c = pick(coupons);
    return { kind: "coupon", tag: "blaze coupon", title: c.title, text: c.text };
  }
  if (roll < 0.8) {
    return { kind: "poem", tag: "i wrote this, don't laugh", title: "for " + name, text: poem() };
  }
  if (roll < 0.9) {
    return { kind: "fortune", tag: "your fortune", title: "a small prophecy", text: pick(fortunes) };
  }
  const k = pick(doodleKinds);
  return { kind: "doodle", tag: "i made you something", title: "a little " + k, text: "drew this with my whole chest. it's yours.", svg: doodle(k) };
}
