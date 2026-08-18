const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'was', 'one', 'our', 'out',
  'get', 'has', 'how', 'its', 'may', 'new', 'now', 'use', 'any', 'who', 'why', 'did', 'does',
  'this', 'that', 'from', 'your', 'what', 'which', 'will', 'with', 'have', 'when', 'then',
  'them', 'there', 'about', 'into', 'just', 'like', 'more', 'some', 'than', 'these', 'very',
  'also', 'where', 'could', 'would', 'should', 'here',
]);

const K1 = 1.2;
const B = 0.75;

/** Field weights, applied by repeating a field's tokens in the document bag. */
const WEIGHT_TITLE = 3;
const WEIGHT_SUMMARY = 2;
const WEIGHT_BODY = 1;

export function tokenize(text: string): string[] {
  // Unicode-aware: an ASCII-only pattern silently drops every Cyrillic, Greek, or CJK word,
  // which reads as "nothing matched" rather than as a bug.
  const raw = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) ?? [];
  return raw.filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

export type IndexedDocument = { title: string; summary: string; body: string };

type Posting = { termFrequency: Map<number, number> };

export type Bm25Index = {
  size: number;
  lengths: number[];
  averageLength: number;
  postings: Map<string, Posting>;
};

function bagOf(document: IndexedDocument): string[] {
  const bag: string[] = [];
  for (const token of tokenize(document.title)) {
    for (let i = 0; i < WEIGHT_TITLE; i++) bag.push(token);
  }
  for (const token of tokenize(document.summary)) {
    for (let i = 0; i < WEIGHT_SUMMARY; i++) bag.push(token);
  }
  for (const token of tokenize(document.body)) {
    for (let i = 0; i < WEIGHT_BODY; i++) bag.push(token);
  }
  return bag;
}

export function buildIndex(documents: readonly IndexedDocument[]): Bm25Index {
  const postings = new Map<string, Posting>();
  const lengths: number[] = [];

  documents.forEach((document, docId) => {
    const bag = bagOf(document);
    lengths.push(bag.length);
    const counts = new Map<string, number>();
    for (const token of bag) counts.set(token, (counts.get(token) ?? 0) + 1);
    for (const [token, count] of counts) {
      let posting = postings.get(token);
      if (posting === undefined) {
        posting = { termFrequency: new Map() };
        postings.set(token, posting);
      }
      posting.termFrequency.set(docId, count);
    }
  });

  const total = lengths.reduce((sum, length) => sum + length, 0);
  return {
    size: documents.length,
    lengths,
    averageLength: documents.length === 0 ? 0 : total / documents.length,
    postings,
  };
}

/** Okapi BM25. Returns raw scores keyed by document id; documents with no match are absent. */
export function score(index: Bm25Index, query: string): Map<number, number> {
  const scores = new Map<number, number>();
  if (index.size === 0 || index.averageLength === 0) return scores;

  for (const term of new Set(tokenize(query))) {
    const posting = index.postings.get(term);
    if (posting === undefined) continue;
    const documentFrequency = posting.termFrequency.size;
    const idf = Math.log(
      1 + (index.size - documentFrequency + 0.5) / (documentFrequency + 0.5),
    );
    for (const [docId, frequency] of posting.termFrequency) {
      const length = index.lengths[docId] ?? index.averageLength;
      const normalized =
        frequency * (K1 + 1) /
        (frequency + K1 * (1 - B + B * (length / index.averageLength)));
      scores.set(docId, (scores.get(docId) ?? 0) + idf * normalized);
    }
  }
  return scores;
}
