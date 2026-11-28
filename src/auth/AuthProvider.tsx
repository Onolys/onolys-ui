import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { AuthService, AuthUser } from "./types";

export type AuthPhase = "loading" | "signedOut" | "unverified" | "verified";

export function phaseOf(status: "loading" | "ready", user: AuthUser | null): AuthPhase {
  if (status === "loading") return "loading";
  if (!user) return "signedOut";
  return user.emailVerified ? "verified" : "unverified";
}

export interface AuthContextValue {
  service: AuthService;
  /** `loading` until the SDK reports its initial state. */
  status: "loading" | "ready";
  user: AuthUser | null;
  /** Single source of truth for "who is looking at the app". */
  phase: AuthPhase;
  /** Signs out and drops every cached query (no PHI left in memory). Rejects if the SDK sign-out fails (cache kept). */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  service,
  onSignOut,
  children,
}: {
  service: AuthService;
  /** Extra app-specific cleanup when the user changes or signs out (prod passes `clearJobs`). */
  onSignOut?: () => void;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const onSignOutRef = useRef(onSignOut);
  useEffect(() => {
    onSignOutRef.current = onSignOut;
  }, [onSignOut]);
  const [state, setState] = useState<{ status: "loading" | "ready"; user: AuthUser | null }>({
    status: "loading",
    user: null,
  });

  const signedIn = useRef(false);
  // undefined until the first report; afterwards the uid (null = signed out).
  const lastUid = useRef<string | null | undefined>(undefined);
  // The one place state follows the SDK: the listener, and sign-out (which must not wait for the listener's later report).
  const report = useCallback(
    (user: AuthUser | null) => {
      const uid = user?.uid ?? null;
      // Different user (or signed out by any route: other tab, revoked token): nothing of the old one may linger.
      if (lastUid.current !== undefined && lastUid.current !== uid) {
        queryClient.clear();
        onSignOutRef.current?.();
      }
      lastUid.current = uid;
      signedIn.current = user !== null;
      setState({ status: "ready", user });
    },
    [queryClient],
  );
  useEffect(() => service.onAuthStateChanged(report), [service, report]);

  // One sign-out at a time: queries still mounted after clear() may 401 again before the guard navigates.
  const inflight = useRef<Promise<void> | null>(null);
  const signOut = useCallback(() => {
    if (!signedIn.current) return Promise.resolve();
    inflight.current ??= (async () => {
      try {
        await service.signOut();
        // Flip to signed out now so callers navigate after the guards already agree; the listener's later report is a no-op.
        // Rendered synchronously: guards redirect (and settle) before the caller navigates.
        flushSync(() => report(null));
        queryClient.clear();
      } finally {
        inflight.current = null;
      }
    })();
    return inflight.current;
  }, [service, queryClient, report]);

  const value = useMemo(
    () => ({ service, ...state, phase: phaseOf(state.status, state.user), signOut }),
    [service, state, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
