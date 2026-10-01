// Headless sanity check for Blaze's understanding layer.
// Run: node tools/nlp-selftest.mjs
import { analyze } from "../js/nlp.js";

const cases = [
  { text: "omg elaaichi 😭", want: { intent: "elichi" } },
  { text: "i'm SO tired today!!!", want: { emotion: "tired", shout: true } },
  { text: "good morning blaze", want: { intent: "greet" } },
  { text: "i love you so much", want: { intent: "love" } },
  { text: "tell me a joke", want: { intent: "joke" } },
  { text: "my dog is Rex", want: { facts: { dog: "Rex" } } },
  { text: "i work at Jenny Internet", want: { intent: "jenny" } },
  { text: "i'm so stressed about work, the customers are awful", want: { emotion: "anxious" } },
  { text: "he dumped me last night", want: { intent: "breakup" } },
  { text: "what should i do about it", want: { question: true } },
  { text: "i hate my body today", want: { intent: "selfimage" } },
  { text: "thank you so much", want: { intent: "thanks" } },
  { text: "i got the job!!", want: { intent: "good_news" } },
  { text: "can't sleep again", want: { intent: "sleep_help" } },
  { text: "my nails look so good", want: { intent: "girly" } },
  { text: "what is your name?", want: { intent: "ask_name" } },
  { text: "who are you", want: { intent: "ask_name" } },
  { text: "surprise me", want: { intent: "surprise" } },
  { text: "what can you do", want: { intent: "abilities" } },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const a = analyze(c.text);
  const checks = [];
  for (const [k, v] of Object.entries(c.want)) {
    if (k === "facts") {
      for (const [fk, fv] of Object.entries(v)) checks.push([`facts.${fk}`, a.facts[fk] === fv, a.facts[fk]]);
    } else {
      checks.push([k, a[k] === v, a[k]]);
    }
  }
  const bad = checks.filter(([, ok]) => !ok);
  if (bad.length === 0) { pass++; console.log(`  ok   "${c.text}"`); }
  else { fail++; console.log(`  FAIL "${c.text}" -> ${bad.map(([k, , got]) => `${k}=${JSON.stringify(got)}`).join(", ")}`); }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
