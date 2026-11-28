import { AUTH_PATHS } from "../constants";

/** `?next=` handling: same-origin paths only (no open redirects). */

/** Pages that are never a sensible post-login target (they would loop or dead-end). */
const BLOCKED = new Set<string>([AUTH_PATHS.login, AUTH_PATHS.signup, AUTH_PATHS.forgotPassword, AUTH_PATHS.action]);

export function readNext(search: string): string {
  const raw = new URLSearchParams(search).get("next");
  // eslint-disable-next-line no-control-regex -- control chars are stripped by URL parsers, hiding "//host"
  if (!raw || !raw.startsWith("/") || raw.startsWith("/" + "/") || raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) return "/";
  const base = window.location.origin; // parse against the page origin: no second absolute-URL literal
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return "/";
  }
  if (url.origin !== base) return "/";
  if (BLOCKED.has(url.pathname.replace(/\/+$/, ""))) return "/";
  return raw;
}

function hasNext(search: string): boolean {
  return readNext(search) !== "/";
}

/** Append the validated `next` from `search` to `path` (omitted when it is just `/`). */
export function withNext(path: string, search: string): string {
  const next = readNext(search);
  return hasNext(search) ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export function loginUrl(pathname: string, search: string): string {
  const target = pathname + search;
  return target === "/" ? AUTH_PATHS.login : `${AUTH_PATHS.login}?next=${encodeURIComponent(target)}`;
}

export function verifyUrl(pathname: string, search: string): string {
  const target = pathname + search;
  return target === "/" ? AUTH_PATHS.verifyEmail : `${AUTH_PATHS.verifyEmail}?next=${encodeURIComponent(target)}`;
}

/** Where the verification email's link returns after verifying; keeps `next` so the user lands where they were going. */
export function verifyContinueUrl(origin: string, next = "/"): string {
  return `${origin}${AUTH_PATHS.verifyEmail}${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}`;
}
