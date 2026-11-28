import { Spinner } from "../ui/spinner";
import { useEffect, useState } from "react";
import { NOTE, SLOW_START_MS } from "../../constants";


/** True once `pending` has stayed true for `delayMs`; false again as soon as it settles (success or error). */
export function useSlowPending(pending: boolean, delayMs = SLOW_START_MS): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => setSlow(true), delayMs);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [pending, delayMs]);
  return pending && slow;
}

/** Friendly "server is waking up" note, shown only while a first request is still pending after the delay. */
export function SlowStartNotice({ pending, delayMs }: { pending: boolean; delayMs?: number }) {
  if (!useSlowPending(pending, delayMs)) return null;
  return (
    <p role="status" aria-live="polite" className={`${NOTE} flex items-center gap-2`}>
      <Spinner className="size-3" />
      Starting the server… this can take a few seconds.
    </p>
  );
}
