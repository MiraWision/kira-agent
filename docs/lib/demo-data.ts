/**
 * Playback of real `kira ask` runs against a two-fact knowledge base about
 * custom domains — the same fixture used to test cross-language retrieval.
 * Scores and rewritten queries are what the tool actually produced; nothing
 * here is invented, and no customer's knowledge appears on this site.
 */
export interface DemoHit {
  id: string;
  score: number;
}

export interface DemoSession {
  label: string;
  question: string;
  askedIn: string;
  search: string;
  rewritten: boolean;
  /** Paragraphs and ordered lists, in the order they were produced. */
  answer: ({ p: string } | { ol: string[] })[];
  hits: DemoHit[];
}

export const DEMO_SESSIONS: DemoSession[] = [
  {
    label: "как подключить домен?",
    question: "как подключить домен, который я уже купил?",
    askedIn: "Russian",
    search: "connect existing custom domain",
    rewritten: true,
    answer: [
      { p: "Откройте **Project settings → Domains** и выберите **Add existing domain**." },
      {
        ol: [
          "Введите имя домена.",
          "Скопируйте две показанные DNS-записи и добавьте их у своего регистратора.",
          "Проверка обычно занимает до часа — после неё домен получит статус **Active**.",
        ],
      },
      {
        p: "Обратите внимание: перенести саму регистрацию домена сюда нельзя — она остаётся у вашего текущего регистратора, домен только указывается на проект.",
      },
    ],
    hits: [
      { id: "domains/connect-existing", score: 1.63 },
      { id: "domains/no-transfer", score: 0.49 },
    ],
  },
  {
    label: "можно перенести регистрацию?",
    question: "могу ли я перенести регистрацию домена к вам?",
    askedIn: "Russian",
    search: "transfer domain registration",
    rewritten: true,
    answer: [
      {
        p: "**Нет, перенести регистрацию домена сюда нельзя.** Регистрация остаётся у вашего текущего регистратора — вместо переноса домен можно просто направить на проект.",
      },
      {
        p: "Оставьте домен там, где он зарегистрирован, и используйте **Add existing domain** в разделе доменов проекта.",
      },
    ],
    hits: [
      { id: "domains/no-transfer", score: 2.08 },
      { id: "domains/connect-existing", score: 0.35 },
    ],
  },
  {
    label: "the same question, in English",
    question: "how do I connect a domain I already bought?",
    askedIn: "English",
    search: "how do I connect a domain I already bought?",
    rewritten: false,
    answer: [
      {
        p: "Open **Project settings → Domains** and choose **Add existing domain**. Enter the domain name, then copy the two DNS records shown and add them at your registrar.",
      },
      { p: "Verification usually finishes within an hour; the domain shows **Active** once it does." },
    ],
    hits: [
      { id: "domains/connect-existing", score: 3.49 },
      { id: "domains/no-transfer", score: 0.31 },
    ],
  },
];

/** Aggregate figures from a run against a private production codebase. */
export const RUN_STATS = [
  { value: "35", label: "facts written" },
  { value: "3m22s", label: "wall clock" },
  { value: "35/35", label: "carried a route" },
  { value: "33/35", label: "high confidence" },
];
