/**
 * One stroke set: 24px box, weight 1.6, currentColor, no fill — so an icon sits
 * next to text without competing with it.
 */
const PATHS = {
  bolt: '<path d="M13 3 5.5 13.5H11l-1 7.5 8-11H12l1-7z"/>',
  map: '<path d="M9 4.5 3.5 6.8v12.7L9 17.2m0-12.7 6 2.4m-6-2.4v12.7m6-10.3 5.5-2.3v12.7L15 19.6m0-12.5v12.5m0 0-6-2.4"/>',
  file: '<path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z"/><path d="M13.5 3.5v5h5M8.5 12.5h7M8.5 16h4.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.6M12 18.9v2.6M4.2 7.2l2.3 1.3M17.5 15.5l2.3 1.3M4.2 16.8l2.3-1.3M17.5 8.5l2.3-1.3"/>',
  terminal: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M7.5 9.5 10.5 12l-3 2.5M13 15h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m15.8 15.8 4.2 4.2"/>',
  chat: '<path d="M20.5 12.5c0 3.6-3.8 6.5-8.5 6.5-1 0-2-.1-2.9-.4L4 20.5l1.4-3.6C4.2 15.7 3.5 14.2 3.5 12.5c0-3.6 3.8-6.5 8.5-6.5s8.5 2.9 8.5 6.5z"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5"/>',
  book: '<path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19v15H6.5a2 2 0 0 0-2 2z"/><path d="M4.5 5.5v15"/>',
  github:
    '<path d="M9 19.5c-4 1.2-4-2.2-5.5-2.7m11 5v-3.3c0-.9.1-1.3-.5-1.8 2.5-.3 5-1.2 5-5.5a4.3 4.3 0 0 0-1.2-3c.1-.3.5-1.5-.1-3.1 0 0-1-.3-3.2 1.2a11 11 0 0 0-5.8 0C6.5 4.8 5.5 5.1 5.5 5.1c-.6 1.6-.2 2.8-.1 3.1a4.3 4.3 0 0 0-1.2 3c0 4.3 2.5 5.2 5 5.5-.4.4-.5.9-.5 1.6v3.5"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
