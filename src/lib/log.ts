const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const useColor = process.stdout.isTTY === true && process.env.NO_COLOR === undefined;
const paint = (code: string, text: string): string => (useColor ? `${code}${text}${RESET}` : text);

export const log = {
  info(message: string): void {
    process.stderr.write(`${message}\n`);
  },
  step(message: string): void {
    process.stderr.write(`${paint(DIM, '›')} ${message}\n`);
  },
  ok(message: string): void {
    process.stderr.write(`${paint(GREEN, '✓')} ${message}\n`);
  },
  warn(message: string): void {
    process.stderr.write(`${paint(YELLOW, '!')} ${message}\n`);
  },
  error(message: string): void {
    process.stderr.write(`${paint(RED, '✗')} ${message}\n`);
  },
  out(message: string): void {
    process.stdout.write(message);
  },
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
