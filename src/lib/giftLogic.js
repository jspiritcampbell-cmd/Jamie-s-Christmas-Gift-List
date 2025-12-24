const AGE_KEYWORDS = {
  kid: ["children", "kids", "storybook", "picture book"],
  teen: ["young adult", "teen", "coming of age"],
  adult: ["bestseller", "popular", "award winning"],
  senior: ["biography", "history", "memoir"]
};

const RELATIONSHIP_KEYWORDS = {
  partner: ["romance", "love", "relationships"],
  mom: ["family", "cooking", "inspiration"],
  dad: ["history", "sports", "leadership"],
  friend: ["humor", "travel", "hobbies"],
  coworker: ["productivity", "business", "self improvement"],
  child: ["children", "adventure", "fantasy"]
};

const PRICE_KEYWORDS = {
  under25: ["short reads", "paperback"],
  "25to50": ["gift edition", "illustrated"],
  over50: ["collector", "hardcover", "boxed set"]
};

function normalizeInterests(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function buildSearchQueries(profile) {
  const {
    ageGroup = "adult",
    relationship = "friend",
    interests = "",
    budget = "under25",
    personality = "practical"
  } = profile || {};

  const interestList = normalizeInterests(interests);

  const base = [
    ...(AGE_KEYWORDS[ageGroup] || []),
    ...(RELATIONSHIP_KEYWORDS[relationship] || []),
    ...(PRICE_KEYWORDS[budget] || [])
  ];

  // personality nudge
  const personalityHints =
    personality === "practical"
      ? ["how to", "guide"]
      : personality === "sentimental"
      ? ["memoir", "letters", "family"]
      : personality === "trendy"
      ? ["popular", "new", "bestseller"]
      : personality === "funny"
      ? ["humor", "comedy"]
      : [];

  // Queries: combine interests with base hints
  // We generate a few query strings to search Open Library
  const queries = [];

  if (interestList.length === 0) {
    queries.push([...base, ...personalityHints].slice(0, 6).join(" "));
  } else {
    for (const interest of interestList.slice(0, 3)) {
      const q = [interest, ...base.slice(0, 3), ...personalityHints.slice(0, 2)]
        .filter(Boolean)
        .join(" ");
      queries.push(q);
    }
  }

  // Ensure uniqueness
  return [...new Set(queries)].slice(0, 3);
}

export function scoreAndShapeBooks(docs, profile) {
  const interests = (profile?.interests || "").toLowerCase();
  const ageGroup = profile?.ageGroup || "adult";

  function score(doc) {
    let s = 0;
    const title = (doc.title || "").toLowerCase();
    const subj = (doc.subject || []).join(" ").toLowerCase();

    // bump if matches interest terms
    for (const token of interests.split(",").map(t => t.trim()).filter(Boolean)) {
      if (!token) continue;
      if (title.includes(token)) s += 4;
      if (subj.includes(token)) s += 2;
    }

    // age heuristics
    if (ageGroup === "kid" && subj.includes("children")) s += 3;
    if (ageGroup === "teen" && (subj.includes("young adult") || subj.includes("teen"))) s += 3;

    // prefer items with cover + author
    if (doc.cover_i) s += 2;
    if (doc.author_name?.length) s += 1;

    return s;
  }

  const shaped = (docs || [])
    .filter(d => d && d.title)
    .map(d => ({
      key: d.key,
      title: d.title,
      author: d.author_name?.[0] || "Unknown author",
      year: d.first_publish_year || null,
      subjects: (d.subject || []).slice(0, 6),
      coverUrl: d.cover_i
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : null,
      openLibraryUrl: d.key ? `https://openlibrary.org${d.key}` : null,
      _score: score(d)
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 10)
    .map(({ _score, ...rest }) => rest);

  return shaped;
}
