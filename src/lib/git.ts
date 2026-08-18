import { execFileSync } from 'node:child_process';

/** Short HEAD sha, or undefined outside a git repo. Never throws. */
export function gitSha(cwd: string): string | undefined {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return sha === '' ? undefined : sha;
  } catch {
    return undefined;
  }
}
