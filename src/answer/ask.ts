import type { LoadedConfig } from '../config.js';
import { streamText } from '../lib/llm.js';
import { loadFacts } from '../knowledge/store.js';
import { retrieve, type ReaderContext, type Retrieved } from '../retrieve/search.js';
import { answerSystemPrompt, answerUserPrompt } from './prompt.js';

export type AskResult = {
  answer: string;
  retrieved: Retrieved[];
  /** Facts existed but none matched — the signal that feeds the gap backlog in v0.2. */
  noMatch: boolean;
  problems: { file: string; message: string }[];
};

export type AskOptions = {
  question: string;
  context: ReaderContext;
  limit?: number;
  onText?: (delta: string) => void;
};

export async function ask(loaded: LoadedConfig, options: AskOptions): Promise<AskResult> {
  const { facts, problems } = loadFacts(loaded.projectRoot);
  const retrieved = retrieve(facts, options.question, options.context, options.limit);

  const answer = await streamText({
    model: loaded.config.models.answer,
    system: answerSystemPrompt(loaded.config, options.context.audience),
    messages: [{ role: 'user', content: answerUserPrompt(options.question, retrieved) }],
    onText: options.onText ?? ((): void => {}),
  });

  return {
    answer,
    retrieved,
    noMatch: retrieved.length === 0,
    problems,
  };
}
