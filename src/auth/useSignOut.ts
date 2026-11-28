import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { AUTH_PATHS } from "../constants";
import { useAuth } from "./AuthProvider";

/** The one way to sign out: sign out, then land on a plain /login. A failure is returned, not thrown. */
export function useSignOut(): { signOut: () => Promise<void>; error: string | null } {
  const { signOut: authSignOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const signOut = useCallback(async () => {
    setError(null);
    try {
      await authSignOut();
    } catch {
      setError("Couldn't sign out. Check your connection and try again.");
      return;
    }
    navigate(AUTH_PATHS.login, { replace: true });
  }, [authSignOut, navigate]);
  return { signOut, error };
}
