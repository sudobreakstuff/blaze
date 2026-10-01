# Blaze 🌙

A little companion who lives in a web page and thinks about Jasmine.

No servers, no APIs, no running costs. Blaze is a **static site** — plain HTML,
CSS and JavaScript — that runs entirely in the browser and is hosted on GitHub
Pages.

- 1000+ hand-written lines (plus a grammar engine for thousands more variations)
- A chibi boy drawn in SVG in a *Pokémon X/Y & ORAS trainer* style, with a walk
  cycle, moods, blinks, gestures and a cosy room that changes with the time of day
- An autonomous "brain": he wanders, checks in, tells jokes, compliments her and
  sends nudges (while the tab is open). He also quietly does things on his own —
  and how much he talks is adjustable in settings
- A rule/flow conversation engine: intent detection, sentiment, shout detection,
  fact memory, multi-turn problem-solving and stories-with-morals
- **Surprises**: he sends her to nice corners of the internet (Radio Garden,
  WindowSwap, Rainy Mood…) and makes her little things — doodles, poems,
  coupons and fortunes — as tappable cards
- Offline browser voice: he can speak and listen (Web Speech API). He auto-picks
  a male voice and pitches it down; you can override the voice in settings

## Run it locally

```bash
npm run serve          # http://localhost:8765
```

That's it — no build step.

## Test

```bash
npm run content        # verifies 1000+ lines and flags duplicates
npm run test           # headless check of the understanding layer
```

Add `?fast=1` to the URL to speed up his timers while testing, and `?debug=1` to
see the live intent/sentiment/state read-out in the corner.

## Customise

- **What he says** lives in `content/`. Add lines to any array and they're picked
  up automatically.
- **Inside jokes** are in `content/inside.js` (elichi, "shahid taught me that",
  Jasmoon, Jenny Internet, girly things, shouting).
- **Stories with morals** are in `content/stories.js` — each has `tags`, `parts`
  and a `moral`.
- **How he looks** is the inline SVG in `index.html` and the `.blaze` rules in
  `css/style.css`.
- **How he behaves** is `js/brain.js` (autonomy), `js/dialogue.js` (conversation)
  and `js/nlp.js` (understanding).

## Deploy

Hosted with GitHub Pages from the `main` branch root:
`https://<user>.github.io/blaze/`

## A note on privacy

The repository is public, so the content is public too. Keep the flirty lines
suggestive rather than explicit — anyone with the link (or view-source) can read
them.

## Honest limits

Blaze is **not** an AI and can't truly reason. He's an unusually deep rule and
conversation-flow engine: he recognises topics, tracks context for a few turns,
asks follow-ups and guides her through problems. He knows when she's shouting,
when she's sad, that she says *elaaichi*, and that she works at Jenny Internet —
but he won't invent an answer about something he's never seen. Notifications only
fire while the page is open, and his memory lives in that browser only.
