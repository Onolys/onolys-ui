import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { readNext } from "../next";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { AUTH_PATHS, H1 } from "../../constants";
import { ErrorSummary, StatusNote } from "./parts";
import { useFormError } from "./useFormError";

export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Resend cooldown end times, in memory only (the privacy policy keeps app data out of browser storage).
 * Survives in-app navigation and remounts, not a full reload.
 */
const cooldownUntil = new Map<string, number>();
const cooldownKey = (email: string | null | undefined) => email ?? "";

/** Seconds left on the resend cooldown for this account. */
function remainingCooldown(email: string | null | undefined): number {
  const until = cooldownUntil.get(cooldownKey(email)) ?? 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

/** Test hook: forget all cooldowns. */
export function resetResendCooldowns(): void {
  cooldownUntil.clear();
}

export function VerifyEmail() {
  const { service, user, signOut: authSignOut } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const next = readNext(search);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(() => remainingCooldown(user?.email));
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const form = useFormError();
  const checking = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Reload + forced token refresh; on success the guard redirects (user.emailVerified flips).
  const check = useCallback(
    async (announce: boolean) => {
      if (checking.current) return;
      checking.current = true;
      if (announce) {
        setNote(null);
        setCheckingNow(true);
      }
      try {
        const fresh = await service.refreshUser();
        if (fresh && !fresh.emailVerified && announce) {
          setNote("We haven't seen your verification yet. Open the link in the email, then try again.");
        }
      } catch {
        if (announce) setNote("Couldn't check just now. Please try again.");
      } finally {
        checking.current = false;
        setCheckingNow(false);
      }
    },
    [service],
  );

  useEffect(() => {
    const onFocus = () => void check(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [check]);

  // Drop the pending (unverified) session and start over on Sign up.
  async function switchEmail() {
    setLeaveError(null);
    try {
      await authSignOut();
    } catch {
      setLeaveError("Couldn't switch just now. Check your connection and try again.");
      return;
    }
    navigate(AUTH_PATHS.signup, { replace: true });
  }

  async function resend() {
    form.clear();
    setNote(null);
    setBusy(true);
    try {
      await service.sendVerificationEmail(next);
      setNote(`Verification email sent to ${user?.email}`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      cooldownUntil.set(cooldownKey(user?.email), Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    } catch (err) {
      form.fail(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="text-center" data-page="verify-email">
      <h1 className={H1}>Verify your email</h1>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-1 gap-4 break-words">
        {form.error && <ErrorSummary error={form.error} search="" />}
        <p>
          Check your inbox — and your spam folder. We sent a verification link to <strong>{user?.email}</strong>.
        </p>
        {note && <StatusNote>{note}</StatusNote>}
        {leaveError && (
          <Alert variant="destructive" className="text-left">
            <AlertDescription>{leaveError}</AlertDescription>
          </Alert>
        )}
        <Button type="button" disabled={checkingNow} onClick={() => void check(true)}>
          {checkingNow ? "Checking…" : "I've verified"}
        </Button>
        <Button type="button" variant="outline" disabled={busy || cooldown > 0} onClick={() => void resend()}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
        </Button>
        <p>
          Wrong address?{" "}
          <Button type="button" variant="link" className="px-1" onClick={() => void switchEmail()}>
            Use a different email
          </Button>
        </p>
      </div>
    </section>
  );
}
