import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../AuthProvider";
import { MIN_PASSWORD_LENGTH, errorCode, mapAuthError } from "../errors";
import type { EmailChangeInfo, EmailChangeKind } from "../types";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { AUTH_PATHS, H1, LINK, NOTE } from "../../constants";
import { ErrorSummary, FORM, STACK, Field, StatusNote } from "./parts";
import type { LoginState } from "./Login";
import { useFormError } from "./useFormError";

/**
 * In-app handler for Firebase email links (verify email, reset password, change of email, recover email). Firebase's hosted handler
 * fails for this project (the link carries a non-web API key), so the email action URL points here
 * and the page uses our own auth instance. The `apiKey` query param is ignored.
 */

export type Continue = { kind: "path"; path: string } | { kind: "external"; href: string };

/** Never an open redirect: same-origin path, or an https URL on one of `allowedHosts`, else `/`. */
export function resolveContinue(raw: string | null, allowedHosts: readonly string[], origin: string = window.location.origin): Continue {
  const home: Continue = { kind: "path", path: "/" };
  if (!raw) return home;
  let url: URL;
  try {
    url = new URL(raw, origin);
  } catch {
    return home;
  }
  if (url.origin === origin) return { kind: "path", path: url.pathname + url.search + url.hash };
  if (url.protocol === "https:" && !url.username && !url.password && allowedHosts.some((h) => h.trim().toLowerCase() === url.hostname)) {
    return { kind: "external", href: url.href };
  }
  return home;
}

const EXPIRED = new Set(["auth/invalid-action-code", "auth/expired-action-code"]);

const NO_HOSTS: readonly string[] = [];

export interface AuthActionProps {
  /** Hostnames (besides this origin) a continue link may send the user back to. Compared lowercase. */
  allowedHosts?: readonly string[];
}

export function AuthAction({ allowedHosts = NO_HOSTS }: AuthActionProps = {}) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const continueUrl = params.get("continueUrl");

  if (oobCode && mode === "verifyEmail") return <VerifyEmailAction oobCode={oobCode} continueUrl={continueUrl} hosts={allowedHosts} />;
  if (oobCode && mode === "resetPassword") return <ResetPasswordAction oobCode={oobCode} />;
  if (oobCode && (mode === "verifyAndChangeEmail" || mode === "recoverEmail")) {
    return <EmailChangeAction key={mode} mode={mode} oobCode={oobCode} continueUrl={continueUrl} hosts={allowedHosts} />;
  }
  return (
    <div className={STACK}>
      <h1 className={H1}>This link isn't valid</h1>
      <p>The link is incomplete or not one we recognise. Request a new one and try again.</p>
      {mode === "revertSecondFactorAddition" && <p>Two-step verification isn't used on Onolys, so there is nothing to undo.</p>}
      <p>
        <Link to={AUTH_PATHS.login} className={LINK}>Go to log in</Link>
      </p>
    </div>
  );
}

function VerifyEmailAction({ oobCode, continueUrl, hosts }: { oobCode: string; continueUrl: string | null; hosts: readonly string[] }) {
  const { service, user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const form = useFormError();
  const next = resolveContinue(continueUrl, hosts);
  // Whose link this is, asked only when the signed-in user is already verified: that user's flag says nothing
  // about another account's code. "dead": no longer valid, so no other account's code to apply either.
  const alreadyVerified = user?.emailVerified === true;
  const userEmail = user?.email ?? null;
  const checkKey = `${oobCode}|${userEmail ?? ""}`;
  const [checked, setChecked] = useState<{ key: string; owner: "same" | "other" | "dead" } | null>(null);
  const owner = checked?.key === checkKey ? checked.owner : "pending";
  useEffect(() => {
    if (!alreadyVerified) return;
    let live = true;
    const settle = (o: "same" | "other" | "dead") => live && setChecked({ key: checkKey, owner: o });
    service.checkEmailVerificationCode(oobCode).then(
      (email) => settle(userEmail !== null && email.toLowerCase() === userEmail.toLowerCase() ? "same" : "other"),
      (err) => settle(EXPIRED.has(errorCode(err) ?? "") ? "dead" : "other"),
    );
    return () => {
      live = false;
    };
  }, [alreadyVerified, service, oobCode, userEmail, checkKey]);

  // Applied only on click: mail scanners prefetch links and would burn the one-time code.
  async function verify() {
    form.clear();
    setFailure(null);
    setBusy(true);
    try {
      await service.applyEmailVerification(oobCode);
      setDone(true);
    } catch (err) {
      const code = errorCode(err) ?? "";
      if (EXPIRED.has(code)) setFailure(code);
      else form.fail(err);
    } finally {
      setBusy(false);
    }
  }

  function carryOn() {
    if (next.kind === "external") window.location.assign(next.href);
    else void navigate(next.path);
  }

  if (alreadyVerified && !done && owner === "pending") {
    return <p className={NOTE}>Checking your link…</p>;
  }

  if (alreadyVerified && !done && (owner === "same" || owner === "dead")) {
    return (
      <div className={STACK}>
        <h1 className={H1}>Already verified</h1>
        <StatusNote>Your email address is already verified.</StatusNote>
        <Button type="button" onClick={carryOn}>
          Continue
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className={STACK}>
        <h1 className={H1}>Email verified</h1>
        <StatusNote>Your email address is verified.</StatusNote>
        <Button type="button" onClick={carryOn}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className={H1}>Verify your email</h1>
      <div className={FORM}>
        {form.error && <ErrorSummary error={form.error} search="" />}
        {failure ? (
          <Alert variant="destructive">
            <AlertDescription>
              <p>This verification link is invalid, has expired, or was already used.</p>
              <p>
                <Link to={user ? AUTH_PATHS.verifyEmail : AUTH_PATHS.login} className={LINK}>
                  {user ? "Get a new verification email" : "Log in to get a new verification email"}
                </Link>
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p>Confirm your email address to finish setting up your account.</p>
            <Button type="button" disabled={busy} onClick={() => void verify()}>
              Verify my email
            </Button>
          </>
        )}
      </div>
    </>
  );
}

/** The pre-check failed for a reason other than an invalid/expired code (network, throttling): the link may still be fine. */
function CheckFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={STACK}>
      <h1 className={H1}>Couldn't check your link</h1>
      <ErrorNote>{message}</ErrorNote>
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function ResetPasswordAction({ oobCode }: { oobCode: string }) {
  const { service } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const form = useFormError();

  // Checking the code does not consume it, so this is safe on load.
  useEffect(() => {
    let live = true;
    service.verifyPasswordResetCode(oobCode).then(
      (e) => live && setEmail(e),
      (err) => {
        if (!live) return;
        if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
        else setCheckError(mapAuthError(errorCode(err)).message);
      },
    );
    return () => {
      live = false;
    };
  }, [service, oobCode, attempt]);

  function retryCheck() {
    setCheckError(null);
    setAttempt((n) => n + 1);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < MIN_PASSWORD_LENGTH) {
      form.failWith(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }
    form.clear();
    setBusy(true);
    try {
      await service.confirmPasswordReset(oobCode, password);
      // Login shows "Password updated" and prefills the email.
      void navigate(AUTH_PATHS.login, { replace: true, state: { email: email ?? undefined, passwordUpdated: true } satisfies LoginState });
    } catch (err) {
      if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
      else form.fail(err);
    } finally {
      setBusy(false);
    }
  }

  if (invalid) {
    return (
      <div className={STACK}>
        <h1 className={H1}>Reset link expired</h1>
        <ErrorNote>This reset link is invalid, has expired, or was already used.</ErrorNote>
        <p>
          <Link to={AUTH_PATHS.forgotPassword} className={LINK}>Request a new reset link</Link>
        </p>
      </div>
    );
  }
  if (checkError) return <CheckFailed message={checkError} onRetry={retryCheck} />;
  if (!email) return <h1 className={H1}>Checking your link…</h1>;

  return (
    <>
      <h1 className={H1}>Choose a new password</h1>
      <form className={FORM} onSubmit={(e) => void onSubmit(e)} noValidate>
        {form.error && <ErrorSummary error={form.error} search="" />}
        <p>
          Resetting the password for <strong>{email}</strong>.
        </p>
        <Field label="New password" id="reset-password" name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} />
        <p className={NOTE}>At least {MIN_PASSWORD_LENGTH} characters. No other rules.</p>
        <Button type="submit" disabled={busy}>
          Update password
        </Button>
      </form>
    </>
  );
}

const COPY: Record<EmailChangeKind, { title: string; button: string; doneTitle: string }> = {
  verifyAndChangeEmail: { title: "Confirm your new email", button: "Confirm new email", doneTitle: "Email updated" },
  recoverEmail: { title: "Restore your email", button: "Restore this email", doneTitle: "Email restored" },
};

function EmailChangeAction({ mode, oobCode, continueUrl, hosts }: { mode: EmailChangeKind; oobCode: string; continueUrl: string | null; hosts: readonly string[] }) {
  const { service } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<EmailChangeInfo | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null); // null until applied
  const [resetSent, setResetSent] = useState(false);
  const form = useFormError();
  const next = resolveContinue(continueUrl, hosts);
  const copy = COPY[mode];

  // Checking the code does not consume it, so this is safe on load. Applying waits for a click.
  useEffect(() => {
    let live = true;
    service.checkEmailChangeCode(oobCode, mode).then(
      (i) => live && setInfo(i),
      (err) => {
        if (!live) return;
        if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
        else setCheckError(mapAuthError(errorCode(err)).message);
      },
    );
    return () => {
      live = false;
    };
  }, [service, oobCode, mode, attempt]);

  function retryCheck() {
    setCheckError(null);
    setAttempt((n) => n + 1);
  }

  async function apply() {
    form.clear();
    setBusy(true);
    try {
      const result = await service.applyEmailChange(oobCode);
      setSignedIn(result.signedIn);
    } catch (err) {
      if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
      else form.fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!info) return;
    form.clear();
    try {
      await service.sendPasswordReset(info.email);
      setResetSent(true);
    } catch (err) {
      form.fail(err);
    }
  }

  function carryOn() {
    if (next.kind === "external") window.location.assign(next.href);
    else void navigate(next.path);
  }

  if (invalid) {
    return (
      <div className={STACK}>
        <h1 className={H1}>Link expired</h1>
        <ErrorNote>This link is invalid, has expired, or was already used.</ErrorNote>
        <p>
          <Link to={AUTH_PATHS.login} className={LINK}>Go to log in</Link>
        </p>
      </div>
    );
  }
  if (checkError) return <CheckFailed message={checkError} onRetry={retryCheck} />;
  if (!info) return <h1 className={H1}>Checking your link…</h1>;

  if (signedIn !== null) {
    return (
      <div className={STACK}>
        <h1 className={H1}>{copy.doneTitle}</h1>
        {mode === "verifyAndChangeEmail" ? (
          <StatusNote>
            Your email address is now <strong>{info.email}</strong>.
            {signedIn ? "" : " Log in again with your new email."}
          </StatusNote>
        ) : (
          <>
            <StatusNote>
              Your email address is back to <strong>{info.email}</strong>.
            </StatusNote>
            <p>If you didn't make this change, someone else may have access to your account. Reset your password to be safe.</p>
            {form.error && <ErrorSummary error={form.error} search="" />}
            {resetSent ? (
              <StatusNote>Password reset email sent. Check your inbox.</StatusNote>
            ) : (
              <Button type="button" onClick={() => void resetPassword()}>
                Reset my password
              </Button>
            )}
          </>
        )}
        {signedIn ? (
          <Button type="button" onClick={carryOn}>
            Continue
          </Button>
        ) : (
          <p>
            <Link to={AUTH_PATHS.login} className={LINK}>Log in</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <h1 className={H1}>{copy.title}</h1>
      <div className={FORM}>
        {form.error && <ErrorSummary error={form.error} search="" />}
        {mode === "verifyAndChangeEmail" ? (
          <p>
            Change the email address on your account to <strong>{info.email}</strong>.
          </p>
        ) : (
          <p>
            Restore the email address on your account to <strong>{info.email}</strong>
            {info.previousEmail ? <> (currently {info.previousEmail})</> : null}.
          </p>
        )}
        <Button type="button" disabled={busy} onClick={() => void apply()}>
          {copy.button}
        </Button>
      </div>
    </>
  );
}

/** Failure notice: role=alert from Alert, no focus move (matches the previous plain role=alert paragraphs). */
function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
