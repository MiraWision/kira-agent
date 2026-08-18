import { z } from 'zod';
import type { Effort } from '../config.js';
import { structured } from '../lib/llm.js';

/**
 * BM25 matches words, so a reader asking in Russian about an English knowledge base scores
 * exactly zero — the retrieval never runs, and the assistant honestly says it does not know
 * something it knows perfectly well. Lexical retrieval cannot bridge languages, so the query
 * is bridged instead: rewritten into the language the facts are written in before it is
 * scored. The answer is still written from the reader's own words, in their language.
 */
const searchQuerySchema = z.object({
  search_query: z.string(),
  language_matched: z.boolean(),
});

const MAX_TOKENS = 400;

function instructions(language: string): string {
  return `You turn a reader's question into a search query for a product knowledge base.

The knowledge base is written in ${language}. Write \`search_query\` in ${language}, as the
words that would appear in the article answering this question — the product nouns and the
action, without question words, politeness, or padding. Keep product and interface names as
the reader wrote them if they already look like the product's own labels.

Set \`language_matched\` to true when the reader's question was already in ${language}.

Do not answer the question. Do not invent product terms the reader did not imply.`;
}

export type NormalizedQuery = {
  /** What retrieval scores. */
  search: string;
  /** What the reader actually asked, which is what the answer is written from. */
  original: string;
  rewritten: boolean;
};

export async function normalizeQuery(params: {
  question: string;
  model: string;
  effort: Effort;
  language: string;
}): Promise<NormalizedQuery> {
  try {
    const result = await structured({
      model: params.model,
      effort: params.effort,
      schema: searchQuerySchema,
      maxTokens: MAX_TOKENS,
      instructions: instructions(params.language),
      input: params.question,
    });
    const search = result.search_query.trim();
    if (search === '') {
      return { search: params.question, original: params.question, rewritten: false };
    }
    return { search, original: params.question, rewritten: !result.language_matched };
  } catch {
    // Retrieval on the raw question is worse than on a rewritten one, but far better than
    // failing the whole answer because a helper call did not come back.
    return { search: params.question, original: params.question, rewritten: false };
  }
}
