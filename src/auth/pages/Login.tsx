import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../AuthProvider";
import { EMAIL_PATTERN, isPopupCancel } from "../errors";
import { withNext } from "../next";
import { Button } from "../../components/ui/button";
import { AUTH_PATHS, H1, LINK } from "../../constants";
import { ErrorSummary, FORM, Field, StatusNote } from "./parts";
import { useFormError } from "./useFormError";

/** Router state set by the password-reset flow. */
export interface LoginState {
  email?: string;
  passwordUpdated?: boolean;
}

/** `showSignup`/`showForgot`/`showGoogle` default on (prod app). Eval turns them off: accounts are operator-created there. `note` replaces them. */
export function Login({ showSignup = true, showForgot = true, showGoogle = true, note }: { showSignup?: boolean; showForgot?: boolean; showGoogle?: boolean; note?: string }) {
  const { service } = useAuth();
  const { search, state } = useLocation();
  const from = (state ?? {}) as LoginState;
  const [busy, setBusy] = useState(false);
  const form = useFormError();

  // A failed redirect sign-in (mobile Google) lands back here with no other trace.
  useEffect(() => {
    void service.consumeRedirectError().then((code) => {
      if (code) form.fail({ code });
    });
  }, [service]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email) return form.failWith("Enter your email.", "email");
    if (!EMAIL_PATTERN.test(email)) return form.failWith("Enter a valid email address.", "email");
    if (!password) return form.failWith("Enter your password.", "password");
    form.clear();
    setBusy(true);
    try {
      await service.signIn(email, password);
    } catch (err) {
      form.fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (busy) return;
    form.clear();
    setBusy(true);
    try {
      await service.signInWithGoogle();
    } catch (err) {
      if (!isPopupCancel(err)) form.fail(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={H1}>Log in</h1>
      <form className={FORM} onSubmit={(e) => void onSubmit(e)} noValidate>
        {from.passwordUpdated && !form.error && <StatusNote>Password updated. Log in with your new password.</StatusNote>}
        {form.error && <ErrorSummary error={form.error} search={search} />}
        <Field label="Email" id="login-email" name="email" type="email" autoComplete="email" defaultValue={from.email ?? ""} required {...form.fieldProps("email")} />
        <Field label="Password" id="login-password" name="password" type="password" autoComplete="current-password" required {...form.fieldProps("password")} />
        <Button type="submit" disabled={busy}>
          Log in
        </Button>
        {showGoogle && <Button type="button" variant="outline" disabled={busy} onClick={() => void google()}>
          Continue with Google
        </Button>}
        {showForgot && <p>
          <Link to={withNext(AUTH_PATHS.forgotPassword, search)} className={LINK}>
            Forgot your password?
          </Link>
        </p>}
        {note && <p>{note}</p>}
        {showSignup && <p>
          New here?{" "}
          <Link to={withNext(AUTH_PATHS.signup, search)} className={LINK}>
            Create an account
          </Link>
        </p>}
      </form>
    </>
  );
}
