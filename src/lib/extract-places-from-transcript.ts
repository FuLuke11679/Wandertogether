import type { ExtractedPlace } from "./extracted-place";

const DENY = new Set(
  [
    "i",
    "we",
    "you",
    "he",
    "she",
    "it",
    "they",
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "so",
    "at",
    "to",
    "in",
    "on",
    "for",
    "of",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "get",
    "got",
    "can",
    "could",
    "would",
    "should",
    "will",
    "just",
    "really",
    "very",
    "here",
    "there",
    "this",
    "that",
    "these",
    "those",
    "what",
    "when",
    "where",
    "which",
    "who",
    "how",
    "why",
    "all",
    "some",
    "any",
    "no",
    "not",
    "yes",
    "okay",
    "ok",
    "alright",
    "yeah",
    "oh",
    "um",
    "uh",
    "like",
    "gonna",
    "wanna",
    "gotta",
    "today",
    "now",
    "then",
    "time",
    "day",
    "way",
    "man",
    "guys",
    "video",
    "tiktok",
    "link",
    "review",
    "come",
    "came",
    "see",
    "saw",
    "go",
    "going",
    "went",
    "make",
    "made",
    "take",
    "took",
    "tell",
    "said",
    "say",
    "know",
    "think",
    "look",
    "looks",
    "thing",
    "things",
    "something",
    "nothing",
    "maybe",
    "even",
    "still",
    "also",
    "back",
    "out",
    "up",
    "down",
    "over",
    "into",
    "about",
    "with",
    "from",
    "by",
    "my",
    "your",
    "his",
    "her",
    "our",
    "their",
    "one",
    "two",
    "first",
    "last",
    "next",
    "other",
    "more",
    "most",
    "much",
    "many",
    "little",
    "bit",
    "lot",
    "right",
    "left",
    "good",
    "bad",
    "great",
    "best",
    "new",
    "old",
    "big",
    "small",
    "little",
    "long",
    "short",
    "high",
    "low",
    "same",
    "another",
    "such",
    "only",
    "own",
    "well",
    "again",
    "once",
    "ever",
    "never",
    "always",
    "sometimes",
    "probably",
    "actually",
    "basically",
    "literally",
    "definitely",
    "sure",
    "maybe",
    "please",
    "thanks",
    "thank",
    "hello",
    "hey",
    "hi",
    "bye",
    "sorry",
    "because",
    "since",
    "while",
    "though",
    "although",
    "however",
    "anyway",
    "whatever",
    "everyone",
    "someone",
    "anyone",
    "everybody",
    "nobody",
    "doing",
    "being",
    "having",
    "getting",
    "making",
    "trying",
    "need",
    "needs",
    "want",
    "wants",
    "let",
    "lets",
    "give",
    "gives",
    "put",
    "puts",
    "set",
    "find",
    "found",
    "use",
    "used",
    "work",
    "works",
    "seem",
    "seems",
    "feel",
    "feels",
    "mean",
    "means",
    "keep",
    "let",
    "help",
    "helps",
    "show",
    "shows",
    "hear",
    "heard",
    "play",
    "run",
    "move",
    "live",
    "believe",
    "bring",
    "happen",
    "write",
    "sit",
    "stand",
    "lose",
    "pay",
    "meet",
    "include",
    "continue",
    "learn",
    "change",
    "watch",
    "follow",
    "stop",
    "create",
    "speak",
    "read",
    "spend",
    "grow",
    "open",
    "walk",
    "win",
    "offer",
    "remember",
    "consider",
    "appear",
    "buy",
    "wait",
    "serve",
    "die",
    "send",
    "build",
    "stay",
    "fall",
    "cut",
    "reach",
    "kill",
    "raise",
    "pass",
    "sell",
    "decide",
    "return",
    "explain",
    "hope",
    "develop",
    "carry",
    "break",
    "receive",
    "agree",
    "support",
    "hit",
    "produce",
    "eat",
    "cover",
    "catch",
    "draw",
    "choose",
    "die",
    "fight",
    "save",
    "serve",
    "end",
    "kill",
    "remain",
    "suggest",
    "raise",
    "pass",
    "sell",
    "require",
    "report",
    "lie",
    "walk",
    "die",
    "check",
    "push",
    "pull",
    "pick",
    "turn",
    "start",
    "show",
    "might",
    "must",
    "shall",
    "ought",
  ].map((w) => w.toLowerCase()),
);

const FOOD_HINTS =
  /\b(ramen|sushi|pizza|restaurant|cafe|coffee|bar|grill|kitchen|bakery|bistro|diner|taco|burger|steakhouse|noodle|dim\s*sum)\b/i;
const CULTURE_HINTS =
  /\b(temple|shrine|museum|gallery|cathedral|mosque|castle|palace|monument|historic)\b/i;
const SHOP_HINTS =
  /\b(mall|market|shop|store|boutique|street|plaza)\b/i;
const NATURE_HINTS = /\b(park|garden|beach|trail|mountain|lake|forest|viewpoint)\b/i;
const NIGHT_HINTS = /\b(club|bar|night|rooftop|lounge)\b/i;

function guessCategory(name: string): { category: string; emoji: string } {
  const n = name.toLowerCase();
  if (FOOD_HINTS.test(n)) return { category: "Food", emoji: "🍽️" };
  if (CULTURE_HINTS.test(n)) return { category: "Culture", emoji: "🏛️" };
  if (SHOP_HINTS.test(n)) return { category: "Shopping", emoji: "🛍️" };
  if (NATURE_HINTS.test(n)) return { category: "Nature", emoji: "🌿" };
  if (NIGHT_HINTS.test(n)) return { category: "Nightlife", emoji: "🌃" };
  return { category: "Culture", emoji: "📍" };
}

function guessDuration(category: string): string {
  if (category === "Food") return "1 hr";
  if (category === "Shopping") return "1 hr";
  if (category === "Nightlife") return "2 hr";
  if (category === "Nature") return "1.5 hr";
  return "1 hr";
}

/**
 * Heuristic place / venue extraction from cleaned transcript text (and optional destination for filtering).
 */
export function extractPlacesFromTranscript(
  plain: string,
  options?: { tripDestination?: string; max?: number },
): ExtractedPlace[] {
  const max = options?.max ?? 12;
  const dest = options?.tripDestination?.trim().toLowerCase();
  const seen = new Set<string>();
  const out: ExtractedPlace[] = [];

  const text = plain.replace(/\s+/g, " ").trim();
  if (!text) return [];

  // Quoted segments often name venues
  const quoted = text.matchAll(/["“”]([^"“”]{2,80})["“”]/g);
  for (const m of quoted) {
    pushCandidate(m[1].trim());
  }

  // "at X", "called X", "visit X"
  const patterns = [
    /\bat\s+([A-Z][^.!?\n]{1,60})/g,
    /\bcalled\s+([A-Z][^.!?\n]{1,60})/g,
    /\bvisit(?:ing)?\s+([A-Z][^.!?\n]{1,60})/g,
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g,
  ];
  for (const re of patterns) {
    let mm: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((mm = re.exec(text)) !== null) {
      const chunk = mm[1].trim();
      const cut = chunk.split(/[.!?,;]/)[0].trim();
      if (cut.length >= 3) pushCandidate(cut);
    }
  }

  // Title-case runs (2–5 words)
  const titleRun =
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/g;
  let tm: RegExpExecArray | null;
  while ((tm = titleRun.exec(text)) !== null) {
    pushCandidate(tm[1].trim());
  }

  function pushCandidate(raw: string) {
    if (out.length >= max) return;
    let name = raw.replace(/\s+/g, " ").trim();
    if (name.length < 3 || name.length > 72) return;
    const words = name.split(/\s+/);
    if (words.length > 8) return;
    const lower = name.toLowerCase();
    const first = words[0].toLowerCase();
    if (DENY.has(first) || DENY.has(lower)) return;
    if (dest && lower === dest) return;
    const key = lower;
    if (seen.has(key)) return;
    seen.add(key);

    const { category, emoji } = guessCategory(name);
    out.push({
      id: out.length + 1,
      name,
      category,
      emoji,
      duration: guessDuration(category),
      checked: true,
    });
  }

  return out.slice(0, max);
}
