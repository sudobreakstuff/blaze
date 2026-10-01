// Blaze — understanding layer.
// Turns "omg elaaichi i'm SO tireddd" into structured meaning with no model.

const EMOJI = {
  "😭": ["sad", -0.8], "😢": ["sad", -0.8], "😔": ["sad", -0.6], "🥺": ["sad", -0.4],
  "😡": ["angry", -0.9], "🤬": ["angry", -1.0], "😤": ["angry", -0.5],
  "😩": ["tired", -0.5], "😫": ["tired", -0.6], "😴": ["tired", -0.3],
  "😂": ["happy", 0.8], "🤣": ["happy", 0.9], "😊": ["happy", 0.7], "🥰": ["love", 1.0],
  "😍": ["love", 1.0], "❤️": ["love", 0.9], "❤": ["love", 0.9], "💕": ["love", 1.0],
  "🙈": ["shy", 0.6], "😏": ["flirty", 0.5], "😉": ["flirty", 0.4], "😘": ["love", 0.9],
  "🥹": ["love", 0.6], "🫶": ["love", 0.9], "😅": ["nervous", 0.1],
};

const LEX = {
  happy: ["happy", "glad", "great", "amazing", "awesome", "excited", "yay", "good", "wonderful", "fantastic", "better", "proud", "yesss", "nice", "lovely", "perfect", "brilliant", "stoked", "chuffed", "lekker"],
  sad: ["sad", "down", "depressed", "cry", "crying", "tears", "heartbroken", "miserable", "awful", "terrible", "horrible", "hurt", "lonely", "alone", "empty", "blue", "gloomy", "broke", "rough", "shattered"],
  angry: ["angry", "mad", "furious", "annoyed", "irritated", "frustrated", "hate", "rage", "pissed", "fedup", "ugh", "unbelievable", "ridiculous", "stupid", "useless"],
  anxious: ["anxious", "anxiety", "nervous", "worried", "scared", "afraid", "panic", "overwhelmed", "stress", "stressed", "pressured", "dread", "insecure", "uncertain"],
  tired: ["tired", "exhausted", "drained", "sleepy", "knackered", "burnt", "burntout", "fatigue", "tuckered", "heavy", "sluggish"],
  love: ["love", "adore", "crush", "obsessed", "cute", "adorable", "beautiful", "gorgeous", "hot", "pretty", "sweet", "precious", "darling", "miss", "missing"],
};
const INTENS = { "very": 1.5, "really": 1.5, "so": 1.4, "super": 1.5, "extremely": 1.8, "incredibly": 1.8, "absolutely": 1.7, "totally": 1.4, "completely": 1.6, "af": 1.6, "fucking": 1.8, "freaking": 1.5, "damn": 1.4, "such": 1.3 };
const NEGATORS = ["not", "no", "never", "dont", "don't", "cant", "can't", "isnt", "isn't", "wasnt", "wasn't", "aint", "ain't", "hardly", "barely"];

// ---- intents: id -> { kw:[], ph:[] (phrases) } ----
export const INTENTS = {
  elichi:        { kw: ["elichi", "elaaichi", "elaichi", "elachi", "elichi"], ph: ["elichi"] },
  greet:         { kw: ["hi", "hey", "hello", "heyy", "heyyy", "yo", "howzit", "morning", "evening", "afternoon", "hiya", "sup"], ph: ["good morning", "good evening", "good afternoon", "how are you", "howzit going"] },
  goodbye:       { kw: ["bye", "goodbye", "cya", "later", "gtg", "gn", "night"], ph: ["good night", "goodnight", "see you", "talk later", "i'm off", "im off", "going to sleep", "off to bed"] },
  love:          { kw: ["love", "adore", "heart", "ily", "luv", "loveyou"], ph: ["i love you", "love you", "i luv u", "luv u", "i love u"] },
  miss:          { kw: ["miss", "missed", "missing"], ph: ["miss you", "missed you"] },
  compliment_me: { kw: ["compliment", "nice", "sweet"], ph: ["compliment me", "say something nice", "say something sweet", "call me pretty", "tell me im pretty"] },
  joke:          { kw: ["joke", "funny", "jokes", "laugh"], ph: ["tell me a joke", "make me laugh", "know any jokes", "say something funny"] },
  story:         { kw: ["story", "tale"], ph: ["tell me a story", "story time", "tell me a tale"] },
  sing:          { kw: ["sing", "song", "singing"], ph: ["sing to me", "sing me a song", "sing something"] },
  dance:         { kw: ["dance", "dancing"], ph: ["dance with me", "show me a dance", "do a dance"] },
  hug:           { kw: ["hug", "cuddle", "hugs"], ph: ["hug me", "give me a hug", "i need a hug", "cuddle me"] },
  kiss:          { kw: ["kiss", "smooch"], ph: ["kiss me", "give me a kiss"] },
  flirt:         { kw: ["flirt", "tease", "charm", "smooth"], ph: ["flirt with me", "be flirty", "tease me"] },
  sad:           { kw: ["sad", "down", "depressed", "crying", "cry", "miserable", "heartbroken", "blue", "gloomy"], ph: ["feeling sad", "feeling down", "i could cry", "i want to cry", "feel like crying", "not okay", "not okay today", "feeling low"] },
  angry:         { kw: ["angry", "mad", "furious", "annoyed", "frustrated", "rage"], ph: ["so angry", "i'm furious", "makes me mad", "pisses me off"] },
  anxious:       { kw: ["anxious", "anxiety", "nervous", "worried", "scared", "panic", "overwhelmed"], ph: ["i'm anxious", "i'm so anxious", "feeling anxious", "i'm worried", "i'm scared", "freaking out"] },
  stressed:      { kw: ["stress", "stressed", "pressure", "overloaded", "swamped"], ph: ["so stressed", "work is stressful", "too much on my plate"] },
  tired:         { kw: ["tired", "exhausted", "drained", "sleepy", "knackered", "fatigue"], ph: ["so tired", "i'm exhausted", "need sleep", "want to sleep"] },
  sleep_help:    { kw: ["insomnia", "awake", "sleep"], ph: ["can't sleep", "cant sleep", "help me sleep", "i'm still awake", "wide awake"] },
  hungry:        { kw: ["hungry", "hungryy", "starving", "eat", "food"], ph: ["i'm hungry", "im hungry", "i'm starving", "want food"] },
  bored:         { kw: ["bored", "boring", "nothing"], ph: ["i'm bored", "im bored", "so bored", "nothing to do"] },
  lonely:        { kw: ["lonely", "alone", "isolated"], ph: ["i feel alone", "so lonely", "no one"] },
  sick:          { kw: ["sick", "ill", "unwell", "flu", "fever", "headache", "cramps"], ph: ["i feel sick", "not feeling well", "feel unwell", "i'm sick"] },
  sorry:         { kw: ["sorry", "apologise", "apologize", "mybad"], ph: ["i'm sorry", "im sorry", "so sorry"] },
  thanks:        { kw: ["thanks", "thank", "thankyou", "thanx", "ta"], ph: ["thank you", "thanks so much", "thank u"] },
  yes:           { kw: ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "definitely", "please"], ph: ["yes please", "why not", "go ahead", "lets do it"] },
  no:            { kw: ["no", "nope", "nah", "never"], ph: ["not really", "no thanks", "no thank you"] },
  good_news:     { kw: ["promotion", "passed", "won", "got", "accepted", "graduated", "raised"], ph: ["good news", "i got the job", "i passed", "guess what"] },
  bad_news:      { kw: ["lost", "failed", "rejected", "fired", "broke", "cancelled", "canceled"], ph: ["bad news", "i failed", "i lost", "i got fired", "it's over"] },
  work:          { kw: ["work", "job", "shift", "office", "colleague", "coworker", "meeting", "deadline", "email"], ph: ["at work", "my job", "my shift", "at the office", "my boss"] },
  jenny:         { kw: ["jenny", "support", "ticket", "tickets", "callcentre", "helpdesk", "client", "clients", "customer", "customers", "queue"], ph: ["jenny internet", "support department", "customer service", "the support desk"] },
  boss:          { kw: ["boss", "manager", "supervisor", "ceo", "hr"], ph: ["my boss", "my manager"] },
  money:         { kw: ["money", "broke", "rent", "salary", "afford", "budget", "debt", "expensive"], ph: ["no money", "can't afford", "cant afford", "so broke", "short on money"] },
  family:        { kw: ["mom", "mum", "dad", "mother", "father", "parents", "sister", "brother", "family", "cousin", "aunt", "uncle"], ph: ["my mom", "my mum", "my dad", "my parents", "my sister", "my brother"] },
  friend:        { kw: ["friend", "friends", "bestie", "friendgroup", "squad"], ph: ["my friend", "my bestie", "my friends"] },
  relationship:  { kw: ["boyfriend", "bf", "girlfriend", "gf", "partner", "husband", "wife", "talking", "crush", "date", "dating"], ph: ["my boyfriend", "my bf", "my crush", "this guy", "this boy", "the guy i like"] },
  breakup:       { kw: ["breakup", "brokeup", "dumped", "ex", "heartbreak"], ph: ["we broke up", "he dumped me", "broke up with", "my ex"] },
  selfimage:     { kw: ["ugly", "fat", "skinny", "insecure", "body", "weight", "pimples", "acne"], ph: ["i feel ugly", "i hate my body", "i'm so fat", "im so fat", "i feel fat", "not pretty enough"] },
  girly:         { kw: ["makeup", "lipstick", "mascara", "nails", "nail", "lashes", "skincare", "perfume", "shopping", "dress", "outfit", "heels", "clothes", "hairstyle", "hair", "gloss"], ph: ["new nails", "my nails", "my hair", "this outfit", "my makeup", "girly"] },
  period:        { kw: ["period", "cramps", "pms", "monthly"], ph: ["on my period", "period cramps"] },
  study:         { kw: ["study", "studies", "exam", "exams", "test", "assignment", "homework", "college", "university", "school", "module"], ph: ["studying for", "have an exam", "my assignment"] },
  weather:       { kw: ["weather", "rain", "raining", "sunny", "cold", "hot", "wind", "storm"], ph: ["the weather", "it's raining", "its so hot", "so cold today"] },
  time:          { kw: ["time", "clock", "late", "early"], ph: ["what time", "what's the time", "whats the time"] },
  remember:      { kw: ["remember", "note", "remind", "memo"], ph: ["remember this", "remember that", "keep in mind", "don't forget", "dont forget"] },
  advice:        { kw: ["advice", "help", "whatshould", "shouldi", "confused", "dunno", "dontknow"], ph: ["what should i do", "help me", "i don't know what", "i dont know what", "any advice", "need advice"] },
  decide:        { kw: ["decide", "choose", "choice", "option"], ph: ["should i", "can't decide", "cant decide", "help me choose"] },
  question:      { ph: ["?", "why", "how", "what", "when", "where", "who"] },
  compliment_give:{ kw: ["handsome", "cute", "amazing", "sweet", "best"], ph: ["you're so", "youre so", "you are so", "i like you", "you're the best"] },
  insult_playful:{ kw: ["stupid", "dumb", "silly", "loser", "idiot", "shush", "quiet"], ph: ["shut up", "you're silly", "youre silly"] },
  ask_name:      { kw: ["name"], ph: ["your name", "whats your name", "what is your name", "who are you", "what are you", "whats your name?", "are you blaze"] },
  abilities:     { kw: ["abilities", "capable"], ph: ["what can you do", "what do you do", "what are you for", "what are you good at"] },
  surprise:      { kw: ["surprise", "gift", "present"], ph: ["surprise me", "give me a gift", "send me something", "show me something", "make me something", "take me somewhere", "send me a link", "something to do", "i'm bored, entertain me"] },
  photos:        { kw: ["photo", "photos", "picture", "pictures", "pic", "pics", "selfie", "polaroid"], ph: ["my photos", "our photos", "the wall", "on the wall", "add a photo", "new photo"] },
};

export function normalize(text) {
  if (!text) return { text: "", shout: 0, exclaim: 0 };
  let s = String(text).trim();
  const letters = s.replace(/[^a-zA-Z]/g, "");
  const upper = s.replace(/[^A-Z]/g, "");
  const shout = letters.length >= 3 ? clamp(upper.length / letters.length, 0, 1) : 0;
  const exclaim = (s.match(/!/g) || []).length;

  // emoji -> tokens
  let emojiEmotion = null, emojiVal = 0;
  for (const k of Object.keys(EMOJI)) {
    if (s.includes(k)) { emojiEmotion = EMOJI[k][0]; emojiVal = EMOJI[k][1]; s = s.replaceAll(k, " " + EMOJI[k][0] + " "); }
  }

  s = s.toLowerCase();
  s = s.replace(/[’`]/g, "'");
  s = s.replace(/(\w)\1{2,}/g, "$1$1");        // sooo -> soo
  s = s.replace(/el+a+i?chi|elichi/g, "elichi"); // any spelling of the gag
  s = s.replace(/[^a-z0-9'\s?!]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  // collapse exaggerated doubling once more (tireddd handled by \1{2,})
  return { text: s, shout, exclaim, emojiEmotion, emojiVal };
}

export function tokenize(text) {
  return (text || "").split(/\s+/).filter(Boolean);
}

const PHRASE_HINT = 3.2;

export function scoreIntents(raw) {
  const n = normalize(raw);
  const toks = tokenize(n.text);
  const scores = {};
  for (const [id, def] of Object.entries(INTENTS)) {
    let sc = 0;
    for (const kw of def.kw || []) {
      if (toks.includes(kw)) sc += 1;
      else if (n.text.includes(kw + " ")) sc += 0.4;
    }
    for (const ph of def.ph || []) {
      if (n.text.includes(ph)) sc += PHRASE_HINT * (ph.split(" ").length);
    }
    if (sc > 0) scores[id] = sc / Math.sqrt(Math.max(toks.length, 1));
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return { ranked, norm: n, tokens: toks };
}

export function sentiment(raw) {
  const n = normalize(raw);
  const toks = tokenize(n.text);
  let valence = 0, arousal = n.shout * 0.6 + clamp(n.exclaim / 3, 0, 1) * 0.3;
  const emotionHits = {};

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    let mult = 1;
    if (INTENS[toks[i - 1]]) mult *= INTENS[toks[i - 1]];
    if (NEGATORS.includes(toks[i - 1])) mult *= -1;

    for (const [emo, words] of Object.entries(LEX)) {
      if (words.includes(t)) {
        emotionHits[emo] = (emotionHits[emo] || 0) + 1;
        const sign = emo === "happy" || emo === "love" ? 1 : -1;
        const mag = emo === "love" ? 0.9 : emo === "happy" ? 0.7 : 0.75;
        valence += sign * mag * mult;
      }
    }
  }
  if (n.emojiEmotion) { emotionHits[n.emojiEmotion] = (emotionHits[n.emojiEmotion] || 0) + 2; valence += n.emojiVal; arousal = Math.max(arousal, Math.abs(n.emojiVal) * 0.7); }

  valence = clamp(valence / 3, -1, 1);
  const emotion = Object.entries(emotionHits).sort((a, b) => b[1] - a[1])[0]?.[0] || (valence > 0.15 ? "happy" : valence < -0.15 ? "sad" : "neutral");

  return { valence, arousal: clamp(arousal, 0, 1), emotion, shout: n.shout, exclaim: n.exclaim, norm: n };
}

export function isQuestion(raw) {
  const n = normalize(raw);
  if (n.text.endsWith("?")) return true;
  return /^(what|why|how|when|where|who|which|whose|whom|can you|could you|do you|are you|will you|is it|should i)\b/.test(n.text);
}

const TOPIC_SETS = {
  work: ["work", "job", "shift", "office", "boss", "manager", "meeting", "deadline", "email", "colleague", "coworker"],
  jenny: ["jenny", "support", "ticket", "tickets", "client", "clients", "customer", "customers", "callcentre", "helpdesk", "queue"],
  love: ["boyfriend", "bf", "crush", "date", "dating", "partner", "relationship", "love", "husband", "wife", "guy", "boy"],
  family: ["mom", "mum", "dad", "mother", "father", "parents", "sister", "brother", "family", "cousin", "aunt", "uncle"],
  friends: ["friend", "friends", "bestie", "squad"],
  money: ["money", "rent", "salary", "afford", "budget", "debt", "broke", "expensive"],
  health: ["sick", "ill", "fever", "headache", "cramps", "period", "tired", "exhausted", "sleep", "insomnia"],
  body: ["ugly", "fat", "skinny", "body", "weight", "pimples", "acne", "insecure", "looks"],
  mood: ["sad", "down", "depressed", "crying", "angry", "mad", "anxious", "anxiety", "stressed", "overwhelmed", "lonely", "alone"],
  girly: ["makeup", "nails", "hair", "outfit", "dress", "skincare", "shopping", "lashes", "perfume"],
  study: ["study", "exam", "test", "assignment", "homework", "college", "university", "school", "module"],
};

export function topics(raw) {
  const n = normalize(raw);
  const found = [];
  for (const [topic, words] of Object.entries(TOPIC_SETS)) {
    if (words.some((w) => n.text.includes(w))) found.push(topic);
  }
  return found;
}

// Extract things worth remembering. Returns a partial facts object.
export function learnFacts(raw) {
  const s = " " + normalize(raw).text + " ";
  const out = {};

  const rel = s.match(/\bmy (dog|cat|pet|boyfriend|bf|girlfriend|gf|mom|mum|dad|sister|brother|bestie|boss|manager)\s+(?:is |named |called )([a-z]{2,})\b/);
  if (rel) out[rel[1]] = cap(rel[2]);

  const loves = s.match(/\bi (?:really |so |absolutely )?(?:love|like|adore|am obsessed with) (?:my )?([a-z][a-z ']{2,22})/);
  if (loves) pushFact(out, "loves", loves[1].trim());

  const hates = s.match(/\bi (?:really |so )?(?:hate|dislike|can't stand|cant stand) (?:my )?([a-z][a-z ']{2,22})/);
  if (hates) pushFact(out, "hates", hates[1].trim());

  const works = s.match(/\bi work (?:at|for|in) (?:the )?([a-z][a-z '&]{2,28})/);
  if (works) out.worksAt = works[1].trim();

  const fav = s.match(/\bmy fav(?:ou?rite)? ([a-z]+) (?:is|are) ([a-z][a-z ']{1,22})/);
  if (fav) out["fav_" + fav[1]] = fav[2].trim();

  const age = s.match(/\bi(?:'m| am) (\d{2}) (?:years|yrs|yo)\b/);
  if (age) out.age = age[1];

  const name = s.match(/\bmy name is ([a-z][a-z]{1,20})/);
  if (name) out.name = cap(name[1]);

  // remember-comma: "remember that i ..." / "remind me to ..."
  const memo = s.match(/\b(?:remember|note) (?:that |this[: ]?)?(.{3,80})/);
  if (memo && !/remember (me|you|this\?)/.test(memo[0])) out.__note = "she told me: " + memo[1].trim();

  const remind = s.match(/\bremind me to (.{3,80})/);
  if (remind) out.__note = "she wants reminding to " + remind[1].trim();

  return out;
}

const FACT_STOP = new Set(["you", "u", "it", "this", "that", "him", "her", "them", "me", "myself", "us", "life", "everyone", "people", "things"]);
function pushFact(out, key, val) {
  const cleaned = val.replace(/\b(really|so|very|the|a|an|my)\b/g, "").replace(/\s+/g, " ").trim();
  if (cleaned && cleaned.length > 1 && !FACT_STOP.has(cleaned)) out[key] = cleaned;
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

// Convenience: full analysis of one utterance.
export function analyze(raw) {
  const { ranked, norm, tokens } = scoreIntents(raw);
  const sent = sentiment(raw);
  const topicList = topics(raw);
  const question = isQuestion(raw);
  const facts = learnFacts(raw);
  const shout = sent.shout > 0.55 || sent.exclaim >= 3 || sent.arousal > 0.75;
  return {
    raw, norm, tokens,
    intent: ranked[0]?.[0] || (question ? "question" : "unknown"),
    intentScore: ranked[0]?.[1] || 0,
    altIntents: ranked.slice(1, 4).map((r) => r[0]),
    scores: Object.fromEntries(ranked),
    sentiment: sent,
    emotion: sent.emotion,
    valence: sent.valence,
    arousal: sent.arousal,
    shout,
    topics: topicList,
    topic: topicList[0] || null,
    question,
    facts,
  };
}
