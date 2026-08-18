/**
 * Minimal glob → RegExp for repo-relative POSIX paths.
 * Supports `**` (any depth, including none when written as `** /`), `*` (within one
 * segment), and `?` (one character within a segment). Everything else is literal.
 */
const REGEXP_SPECIALS = /[.+^${}()|[\]\\]/g;

export function globToRegExp(pattern: string): RegExp {
  let out = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i]!;
    if (ch === '*') {
      const isDouble = pattern[i + 1] === '*';
      if (isDouble) {
        // `**/` collapses to "zero or more path segments"
        if (pattern[i + 2] === '/') {
          out += '(?:[^/]*\\/)*';
          i += 3;
          continue;
        }
        out += '.*';
        i += 2;
        continue;
      }
      out += '[^/]*';
      i += 1;
      continue;
    }
    if (ch === '?') {
      out += '[^/]';
      i += 1;
      continue;
    }
    out += ch.replace(REGEXP_SPECIALS, '\\$&');
    i += 1;
  }
  return new RegExp(`^${out}$`);
}

export function makeMatcher(patterns: readonly string[]): (path: string) => boolean {
  const regexps = patterns.map(globToRegExp);
  return (path: string) => regexps.some((re) => re.test(path));
}
