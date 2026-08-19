Retrieval decides what the assistant may know. The answering contract decides what it may say.

## Retrieved facts are the only source

Everything KIRA states about your product comes from the facts retrieved for that question. Not
from the model's general knowledge of how products like yours usually work, and not from what
seems reasonable given the rest of the conversation.

When the facts do not answer what was asked, it says so. That trade is made the same way every
time, and it is worth stating plainly because it is the whole product:

> An honest "I don't have that" costs the reader one follow-up. A plausible walkthrough of a
> screen that does not exist costs them their afternoon and their trust in you.

Concretely, and including when the retrieved facts are merely adjacent to the question rather than
about it, the assistant will not invent buttons, links, tabs, screens, wizard steps or labels; will
not imply it checked the product; will not answer a yes/no capability question unless a fact
settles it; and will not stretch a related fact into instructions.

## Boundaries lead the answer

When the reader asks whether something is possible and a fact settles it, the **first sentence**
answers yes or no. The alternative comes after it, never before.

This is a specific rule for a specific observed failure. Asked "can I transfer my domain
registration here?", an assistant with the right `boundary` fact in hand will still happily open
with the steps for a *different* workflow — pointing a domain you already own — and never say the
word no. A reader who skims the first line then walks away believing the opposite of the truth.

> [!WARNING]
> This behaviour is prompt-tuned, not guaranteed. In testing, six of seven samples led correctly
> after the instruction was added — which is exactly the sample size that proves nothing. The
> judge in v0.2 exists because this class of error is intermittent, and a manual spot-check will
> sign off on a prompt that fails one time in five.

## Language

Under `assistant.language: mirror`, the answer is written in the language of the reader's message
— including regional variants — while **interface labels stay exactly as the facts record them**.

That split is deliberate. Prose in your reader's language is what makes the answer usable; a
translated button label is what makes it useless, because they then cannot find the button. A
label may be glossed once in their language, but it is quoted in the product's.

The question is separately rewritten for retrieval (see [Retrieval](../retrieval/)),
but the answer is generated from the reader's own words, so their framing survives.

## What it never says

No file paths, function names, internal routes, table names or repository names — even when one
appears in a retrieved fact, and even when the reader asks in technical terms. The reader cannot
open the code; naming the code tells them nothing and leaks your internals into a support channel.

It also does not mention the facts, the knowledge base, retrieval, or where the information came
from. It writes as your product's own help, not as a system reporting on itself.

## Follow-ups

At most one, and only when the retrieved facts clearly also cover that next step, and only when
the main answer was a real answer. If it just said it was unsure, it stops there.

The test the prompt applies: if the honest reply to the follow-up it is about to offer would be
"I don't have that", it does not offer it. An assistant that ends every uncertain answer with a
cheerful "want me to explain how X works?" — where X is something it also cannot explain — turns
one gap into two.

## When nothing matches

The assistant is still asked to answer, with an explicit note that no facts matched. That is
deliberate: it replies in the reader's language, tells them it does not have reliable information,
and points them somewhere real — the product itself, their team, or support — without naming
controls it cannot verify.

On the caller's side, `no_match: true` comes back in `--json`. Log it. Those questions are the
documentation backlog, and they are also product intelligence: what users cannot find is a UX
finding, not only a content one.
