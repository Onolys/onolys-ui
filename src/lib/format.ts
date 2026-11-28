/** Elapsed milliseconds as `m:ss`. */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms)) return "0:00";
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** A reset timestamp as a short local clock time with its time zone ("9:00 AM PST"); undefined when unparseable. */
export function formatResetTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

/** A date as the person's own locale and time zone render it ("Nov 24, 2026"): the one format the report and the version list share. Unparseable input comes back as given. */
export function formatDate(iso: string, opts: { locale?: string; timeZone?: string } = {}): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(opts.locale, { year: "numeric", month: "short", day: "numeric", timeZone: opts.timeZone });
}
