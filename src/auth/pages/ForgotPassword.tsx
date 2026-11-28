import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../AuthProvider";
import { EMAIL_PATTERN, errorCode } from "../errors";
import { withNext } from "../next";
import { Button } from "../../components/ui/button";
import { AUTH_PATHS, H1, LINK } from "../../constants";
import { ErrorSummary, FORM, Field, StatusNote } from "./parts";
import { useFormError } from "./useFormError";

/** Same confirmation for every email: no account enumeration. */
export const RESET_CONFIRMATION = "If an account exists for that address, we've emailed a link.";

// Only failures that say nothing about the account are shown; everything else gets the confirmation.
// "invalid-email" is about the input, not the account.
const SHOWN = new Set(["auth/network-request-failed", "auth/too-many-requests", "auth/invalid-email", "email/unavailable"]);

export function ForgotPassword() {
  const { service } = useAuth();
  const { search } = useLocation();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useFormError();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    form.clear();
    setSent(false);
    if (!email) return form.failWith("Enter your email address.", "email");
    if (!EMAIL_PATTERN.test(email)) return form.failWith("Enter a valid email address.", "email");
    setBusy(true);
    try {
      await service.sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      if (SHOWN.has(errorCode(err) ?? "")) form.fail(err);
      else setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={H1}>Reset your password</h1>
      <form className={FORM} onSubmit={(e) => void onSubmit(e)} noValidate>
        {form.error && <ErrorSummary error={form.error} search={search} />}
        {sent && <StatusNote>{RESET_CONFIRMATION}</StatusNote>}
        <Field label="Email" id="forgot-email" name="email" type="email" autoComplete="email" required {...form.fieldProps("email")} />
        <Button type="submit" disabled={busy}>
          Send reset link
        </Button>
        <p>
          <Link to={withNext(AUTH_PATHS.login, search)} className={LINK}>
            Back to log in
          </Link>
        </p>
      </form>
    </>
  );
}
