import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../AuthProvider";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, isPopupCancel } from "../errors";
import { readNext, withNext } from "../next";
import { Button } from "../../components/ui/button";
import { AUTH_PATHS, H1, LINK, NOTE } from "../../constants";
import { ErrorSummary, FORM, Field } from "./parts";
import { useFormError } from "./useFormError";

export function Signup() {
  const { service } = useAuth();
  const { search } = useLocation();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const form = useFormError();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (!email) return form.failWith("Enter your email.", "email");
    if (!EMAIL_PATTERN.test(email)) return form.failWith("Enter a valid email address.", "email");
    if (password.length < MIN_PASSWORD_LENGTH) {
      return form.failWith(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`, "password");
    }
    if (confirm !== password) return form.failWith("Passwords don't match.", "confirm");
    form.clear();
    setBusy(true);
    try {
      await service.signUp(email, password, readNext(search)); // the guard then moves us to /verify-email
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
      <h1 className={H1}>Sign up</h1>
      <form className={FORM} onSubmit={(e) => void onSubmit(e)} noValidate>
        {form.error && <ErrorSummary error={form.error} search={search} />}
        <Field label="Email" id="signup-email" name="email" type="email" autoComplete="email" required {...form.fieldProps("email")} />
        <Field label="Password" id="signup-password" name="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} {...form.fieldProps("password")} />
        <Field label="Confirm password" id="signup-confirm" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" required {...form.fieldProps("confirm")} />
        <Button type="button" variant="outline" aria-pressed={show} onClick={() => setShow((v) => !v)}>
          Show passwords
        </Button>
        <p className={NOTE}>At least {MIN_PASSWORD_LENGTH} characters. No other rules.</p>
        <Button type="submit" disabled={busy}>
          Create account
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void google()}>
          Continue with Google
        </Button>
        <p>
          Already have an account?{" "}
          <Link to={withNext(AUTH_PATHS.login, search)} className={LINK}>
            Log in
          </Link>
        </p>
      </form>
    </>
  );
}
