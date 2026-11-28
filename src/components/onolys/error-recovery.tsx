import { useEffect, useRef } from "react";
import { ACTIONS, LINK } from "../../constants";

const SAFE_REFERENCE = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Recovery copy is fixed: never expose exception messages or response bodies.
 * Callers map their own errors to a numeric `status` and a request `reference`; a reference that is not a plain id is ignored.
 */
export function ErrorRecovery({ status, reference, homeHref = "/", reload = () => window.location.reload() }: {
  status?: number;
  reference?: string;
  homeHref?: string;
  reload?: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const safeReference = reference && SAFE_REFERENCE.test(reference) ? reference : undefined;
  const notFound = status === 404;
  return (
    <section role="alert" className="grid gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold">{notFound ? "Page not found" : "Something went wrong"}</h1>
      <p>{notFound ? "We couldn't find this page. Check the link or go back to the start." : "We couldn't load this page. Reload to try again, or go back to the start."}</p>
      {status ? <p className="text-sm text-muted-foreground">Error {status}</p> : null}
      {safeReference ? <p className="break-all text-sm text-muted-foreground">Reference: {safeReference}</p> : null}
      <div className={ACTIONS}>
        <button type="button" className="min-h-11 rounded-md border border-border px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2" onClick={reload}>Reload page</button>
        <a href={homeHref} className={LINK}>Back to the start</a>
      </div>
    </section>
  );
}
