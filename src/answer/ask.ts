import type { LoadedConfig } from '../config.js';
import { streamText } from '../lib/llm.js';
import { loadFacts } from '../knowledge/store.js';
import { normalizeQuery, type NormalizedQuery } from '../retrieve/query.js';
import { retrieve, type ReaderContext, type Retrieved } from '../retrieve/search.js';
import { answerSystemPrompt, answerUserPrompt } from './prompt.js';

export type AskResult = {
  answer: string;
  query: NormalizedQuery;
  retrieved: Retrieved[];
  /** Facts existed but none matched — the signal that feeds the gap backlog in v0.2. */
  noMatch: boolean;
  problems: { file: string; message: string }[];
};

export type AskOptions = {
  question: string;
  context: ReaderContext;
  limit?: number;
  /** Score the reader's words as typed, skipping the rewrite hop. */
  rawQuery?: boolean;
  onText?: (delta: string) => void;
};

export async function ask(loaded: LoadedConfig, options: AskOptions): Promise<AskResult> {
  const { facts, problems } = loadFacts(loaded.projectRoot);

  const query: NormalizedQuery =
    options.rawQuery === true
      ? { search: options.question, original: options.question, rewritten: false }
      : await normalizeQuery({
          question: options.question,
          model: loaded.config.models.answer,
          effort: 'low',
          language: loaded.config.knowledge.language,
        });

  const retrieved = retrieve(facts, query.search, options.context, options.limit);

  const answer = await streamText({
    model: loaded.config.models.answer,
    effort: loaded.config.effort.answer,
    system: answerSystemPrompt(loaded.config, options.context.audience),
    // The answer is written from what the reader actually asked, not the rewritten query, so
    // it stays in their language and their framing.
    messages: [{ role: 'user', content: answerUserPrompt(options.question, retrieved) }],
    onText: options.onText ?? ((): void => {}),
  });

  return {
    answer,
    query,
    retrieved,
    noMatch: retrieved.length === 0,
    problems,
  };
}
