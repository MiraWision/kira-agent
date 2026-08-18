import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

/**
 * Non-streaming ceiling. Kept under the SDK's HTTP timeout; a truncated response is retried
 * once at the higher ceiling below rather than failing the batch.
 */
const MAX_TOKENS = 16_000;
const MAX_TOKENS_RETRY = 32_000;

export class LlmError extends Error {}

let cached: Anthropic | null = null;

/**
 * The SDK resolves credentials itself: ANTHROPIC_API_KEY, then ANTHROPIC_AUTH_TOKEN, then an
 * `ant auth login` profile. ANTHROPIC_BASE_URL is honoured too — see README if a proxy base
 * URL produces 404s.
 */
export function client(): Anthropic {
  cached ??= new Anthropic();
  return cached;
}

export type StructuredRequest<T extends z.ZodType> = {
  model: string;
  schema: T;
  /** Stable across calls — cached, so keep instructions here and inputs in `input`. */
  instructions: string;
  input: string;
};

/**
 * One structured-output call. The schema is enforced at the API layer, so there is no JSON
 * parsing, no fenced-code stripping, and no escalating-token parse-retry loop to maintain.
 */
export async function structured<T extends z.ZodType>(
  request: StructuredRequest<T>,
): Promise<z.infer<T>> {
  for (const maxTokens of [MAX_TOKENS, MAX_TOKENS_RETRY]) {
    const response = await client().messages.parse({
      model: request.model,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: request.instructions,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: request.input }],
      output_config: { format: zodOutputFormat(request.schema) },
    });

    if (response.stop_reason === 'refusal') {
      throw new LlmError(
        `model declined the request (${response.stop_details?.category ?? 'unknown category'})`,
      );
    }
    if (response.stop_reason === 'max_tokens') {
      if (maxTokens === MAX_TOKENS_RETRY) {
        throw new LlmError('response exceeded the output budget even after retrying');
      }
      continue;
    }
    if (response.parsed_output === null || response.parsed_output === undefined) {
      throw new LlmError('model returned no parseable structured output');
    }
    return response.parsed_output as z.infer<T>;
  }
  throw new LlmError('structured output could not be produced');
}

export type StreamRequest = {
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  onText: (delta: string) => void;
};

/** Streams a prose answer. Used by both `kira ask` and (later) the serve endpoint. */
export async function streamText(request: StreamRequest): Promise<string> {
  const stream = client().messages.stream({
    model: request.model,
    max_tokens: 4_000,
    system: [
      { type: 'text', text: request.system, cache_control: { type: 'ephemeral' } },
    ],
    messages: request.messages,
  });
  stream.on('text', request.onText);
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') {
    throw new LlmError('model declined to answer');
  }
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
