import {
  AUTH_PATHS,
  Alert,
  AlertDescription,
  Button,
  H1,
  Input,
  LINK,
  Label,
  NOTE
} from "../chunk-MUYPUVON.js";
import {
  AuthError
} from "../chunk-5F642S7P.js";

// src/auth/AuthProvider.tsx
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { jsx } from "react/jsx-runtime";
function phaseOf(status, user) {
  if (status === "loading") return "loading";
  if (!user) return "signedOut";
  return user.emailVerified ? "verified" : "unverified";
}
var AuthContext = createContext(null);
function AuthProvider({
  service,
  onSignOut,
  children
}) {
  const queryClient = useQueryClient();
  const onSignOutRef = useRef(onSignOut);
  useEffect(() => {
    onSignOutRef.current = onSignOut;
  }, [onSignOut]);
  const [state, setState] = useState({
    status: "loading",
    user: null
  });
  const signedIn = useRef(false);
  const lastUid = useRef(void 0);
  useEffect(
    () => service.onAuthStateChanged((user) => {
      const uid = user?.uid ?? null;
      if (lastUid.current !== void 0 && lastUid.current !== uid) {
        queryClient.clear();
        onSignOutRef.current?.();
      }
      lastUid.current = uid;
      signedIn.current = user !== null;
      setState({ status: "ready", user });
    }),
    [service, queryClient]
  );
  const inflight = useRef(null);
  const signOut = useCallback(() => {
    if (!signedIn.current) return Promise.resolve();
    inflight.current ??= (async () => {
      try {
        await service.signOut();
        queryClient.clear();
      } finally {
        inflight.current = null;
      }
    })();
    return inflight.current;
  }, [service, queryClient]);
  const value = useMemo(
    () => ({ service, ...state, phase: phaseOf(state.status, state.user), signOut }),
    [service, state, signOut]
  );
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

// src/auth/guards.tsx
import { Navigate, Outlet, useLocation } from "react-router";

// src/auth/next.ts
var BLOCKED = /* @__PURE__ */ new Set([AUTH_PATHS.login, AUTH_PATHS.signup, AUTH_PATHS.forgotPassword, AUTH_PATHS.action]);
function readNext(search) {
  const raw = new URLSearchParams(search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) return "/";
  const base = window.location.origin;
  let url;
  try {
    url = new URL(raw, base);
  } catch {
    return "/";
  }
  if (url.origin !== base) return "/";
  if (BLOCKED.has(url.pathname.replace(/\/+$/, ""))) return "/";
  return raw;
}
function hasNext(search) {
  return readNext(search) !== "/";
}
function withNext(path, search) {
  const next = readNext(search);
  return hasNext(search) ? `${path}?next=${encodeURIComponent(next)}` : path;
}
function loginUrl(pathname, search) {
  const target = pathname + search;
  return target === "/" ? AUTH_PATHS.login : `${AUTH_PATHS.login}?next=${encodeURIComponent(target)}`;
}
function verifyUrl(pathname, search) {
  const target = pathname + search;
  return target === "/" ? AUTH_PATHS.verifyEmail : `${AUTH_PATHS.verifyEmail}?next=${encodeURIComponent(target)}`;
}
function verifyContinueUrl(origin, next = "/") {
  return `${origin}${AUTH_PATHS.verifyEmail}${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}`;
}

// src/auth/guards.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function Loading() {
  return /* @__PURE__ */ jsx2("p", { role: "status", "aria-live": "polite", children: "Loading\u2026" });
}
function RequireVerified() {
  const { phase } = useAuth();
  const { pathname, search } = useLocation();
  if (phase === "loading") return /* @__PURE__ */ jsx2(Loading, {});
  if (phase === "signedOut") return /* @__PURE__ */ jsx2(Navigate, { to: loginUrl(pathname, search), replace: true });
  if (phase === "unverified") return /* @__PURE__ */ jsx2(Navigate, { to: verifyUrl(pathname, search), replace: true });
  return /* @__PURE__ */ jsx2(Outlet, {});
}
function PublicOnly() {
  const { phase } = useAuth();
  const { search } = useLocation();
  if (phase === "loading") return /* @__PURE__ */ jsx2(Loading, {});
  if (phase === "verified") return /* @__PURE__ */ jsx2(Navigate, { to: readNext(search), replace: true });
  if (phase === "unverified") return /* @__PURE__ */ jsx2(Navigate, { to: withNext(AUTH_PATHS.verifyEmail, search), replace: true });
  return /* @__PURE__ */ jsx2(Outlet, {});
}
function RequireUnverified() {
  const { phase } = useAuth();
  const { search } = useLocation();
  if (phase === "loading") return /* @__PURE__ */ jsx2(Loading, {});
  if (phase === "signedOut") return /* @__PURE__ */ jsx2(Navigate, { to: withNext(AUTH_PATHS.login, search), replace: true });
  if (phase === "verified") return /* @__PURE__ */ jsx2(Navigate, { to: readNext(search), replace: true });
  return /* @__PURE__ */ jsx2(Outlet, {});
}

// src/auth/useSignOut.ts
import { useCallback as useCallback2, useState as useState2 } from "react";
import { useNavigate } from "react-router";
function useSignOut() {
  const { signOut: authSignOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState2(null);
  const signOut = useCallback2(async () => {
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

// src/auth/errors.ts
var MIN_PASSWORD_LENGTH = 8;
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isPopupCancel(err) {
  const code = errorCode(err);
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}
function mapAuthError(code) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/user-not-found":
      return { message: "That email and password don't match. Try again or reset your password." };
    case "auth/weak-password":
      return { message: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`, field: "password" };
    case "auth/email-already-in-use":
      return { message: "An account with this email already exists.", offerLogin: true };
    case "auth/invalid-email":
      return { message: "Enter a valid email address.", field: "email" };
    case "auth/missing-email":
      return { message: "Enter your email.", field: "email" };
    case "auth/missing-password":
      return { message: "Enter your password.", field: "password" };
    case "auth/account-exists-with-different-credential":
      return { message: "This email has a password account. Sign in with your password." };
    case "auth/popup-blocked":
      return { message: "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again." };
    case "auth/operation-not-allowed":
      return { message: "This sign-in method isn't available. Contact support." };
    case "auth/internal-error":
    case "auth/quota-exceeded":
      return { message: "The sign-in service is having trouble. Try again in a few minutes." };
    case "auth/web-storage-unsupported":
    case "auth/operation-not-supported-in-this-environment":
      return { message: "Your browser is blocking what sign-in needs. Enable cookies and site storage, or try another browser." };
    case "auth/too-many-requests":
      return { message: "Too many attempts. Wait a few minutes and try again." };
    case "email/unavailable":
      return { message: "We couldn't send the email. Try again in a moment." };
    case "auth/network-request-failed":
      return { message: "Can't reach the server. Check your connection and try again." };
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return { message: "Google sign-in was cancelled." };
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return { message: "This link is invalid, has expired, or was already used." };
    case "auth/user-token-expired":
    case "auth/requires-recent-login":
      return { message: "Please log in again and retry." };
    case "auth/user-disabled":
      return { message: "This account has been disabled. Contact support." };
    default:
      return { message: "Something went wrong. Please try again." };
  }
}
function errorCode(err) {
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
    return err.code;
  }
  return void 0;
}

// src/auth/pages/AuthAction.tsx
import { useEffect as useEffect3, useState as useState4 } from "react";
import { Link as Link2, useLocation as useLocation2, useNavigate as useNavigate2 } from "react-router";

// src/auth/pages/parts.tsx
import { useEffect as useEffect2, useRef as useRef2 } from "react";
import { Link } from "react-router";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var ERROR_ID = "form-error";
var FORM = "mt-4 grid max-w-sm grid-cols-1 gap-4 break-words";
var STACK = "grid max-w-sm grid-cols-1 gap-4 break-words";
function ErrorSummary({ error, search }) {
  const ref = useRef2(null);
  useEffect2(() => {
    ref.current?.focus();
  }, [error]);
  return /* @__PURE__ */ jsx3(
    Alert,
    {
      variant: "destructive",
      id: ERROR_ID,
      tabIndex: -1,
      ref,
      className: "border-destructive focus-visible:ring-[3px] focus-visible:ring-ring",
      children: /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx3("p", { children: error.message }),
        error.offerLogin && /* @__PURE__ */ jsx3("p", { children: /* @__PURE__ */ jsx3(Link, { to: withNext(AUTH_PATHS.login, search), className: LINK, children: "Log in instead" }) })
      ] })
    }
  );
}
function StatusNote({ children }) {
  return /* @__PURE__ */ jsx3(Alert, { role: "status", className: "bg-muted text-foreground", children: /* @__PURE__ */ jsx3(AlertDescription, { className: "text-foreground", children }) });
}
function Field({ label, id, ...input }) {
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
    /* @__PURE__ */ jsx3(Label, { htmlFor: id, className: "min-h-0 text-base font-semibold", children: label }),
    /* @__PURE__ */ jsx3(Input, { id, ...input })
  ] });
}

// src/auth/pages/useFormError.ts
import { useState as useState3 } from "react";
function useFormError() {
  const [error, setError] = useState3(null);
  return {
    error,
    clear: () => setError(null),
    fail: (err) => setError(mapAuthError(errorCode(err))),
    failWith: (message, field) => setError({ message, field }),
    /** aria attributes for an input, set while the current error is about that field. */
    fieldProps: (name) => error?.field === name ? { "aria-invalid": true, "aria-describedby": ERROR_ID } : {}
  };
}

// src/auth/pages/AuthAction.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function resolveContinue(raw, allowedHosts, origin = window.location.origin) {
  const home = { kind: "path", path: "/" };
  if (!raw) return home;
  let url;
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
var EXPIRED = /* @__PURE__ */ new Set(["auth/invalid-action-code", "auth/expired-action-code"]);
var NO_HOSTS = [];
function AuthAction({ allowedHosts = NO_HOSTS } = {}) {
  const { search } = useLocation2();
  const params = new URLSearchParams(search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");
  const continueUrl = params.get("continueUrl");
  if (oobCode && mode === "verifyEmail") return /* @__PURE__ */ jsx4(VerifyEmailAction, { oobCode, continueUrl, hosts: allowedHosts });
  if (oobCode && mode === "resetPassword") return /* @__PURE__ */ jsx4(ResetPasswordAction, { oobCode });
  if (oobCode && (mode === "verifyAndChangeEmail" || mode === "recoverEmail")) {
    return /* @__PURE__ */ jsx4(EmailChangeAction, { mode, oobCode, continueUrl, hosts: allowedHosts }, mode);
  }
  return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
    /* @__PURE__ */ jsx4("h1", { className: H1, children: "This link isn't valid" }),
    /* @__PURE__ */ jsx4("p", { children: "The link is incomplete or not one we recognise. Request a new one and try again." }),
    mode === "revertSecondFactorAddition" && /* @__PURE__ */ jsx4("p", { children: "Two-step verification isn't used on Onolys, so there is nothing to undo." }),
    /* @__PURE__ */ jsx4("p", { children: /* @__PURE__ */ jsx4(Link2, { to: AUTH_PATHS.login, className: LINK, children: "Go to log in" }) })
  ] });
}
function VerifyEmailAction({ oobCode, continueUrl, hosts }) {
  const { service, user } = useAuth();
  const navigate = useNavigate2();
  const [busy, setBusy] = useState4(false);
  const [done, setDone] = useState4(false);
  const [failure, setFailure] = useState4(null);
  const form = useFormError();
  const next = resolveContinue(continueUrl, hosts);
  const alreadyVerified = user?.emailVerified === true;
  const userEmail = user?.email ?? null;
  const checkKey = `${oobCode}|${userEmail ?? ""}`;
  const [checked, setChecked] = useState4(null);
  const owner = checked?.key === checkKey ? checked.owner : "pending";
  useEffect3(() => {
    if (!alreadyVerified) return;
    let live = true;
    const settle = (o) => live && setChecked({ key: checkKey, owner: o });
    service.checkEmailVerificationCode(oobCode).then(
      (email) => settle(userEmail !== null && email.toLowerCase() === userEmail.toLowerCase() ? "same" : "other"),
      (err) => settle(EXPIRED.has(errorCode(err) ?? "") ? "dead" : "other")
    );
    return () => {
      live = false;
    };
  }, [alreadyVerified, service, oobCode, userEmail, checkKey]);
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
    return /* @__PURE__ */ jsx4("p", { className: NOTE, children: "Checking your link\u2026" });
  }
  if (alreadyVerified && !done && (owner === "same" || owner === "dead")) {
    return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
      /* @__PURE__ */ jsx4("h1", { className: H1, children: "Already verified" }),
      /* @__PURE__ */ jsx4(StatusNote, { children: "Your email address is already verified." }),
      /* @__PURE__ */ jsx4(Button, { type: "button", onClick: carryOn, children: "Continue" })
    ] });
  }
  if (done) {
    return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
      /* @__PURE__ */ jsx4("h1", { className: H1, children: "Email verified" }),
      /* @__PURE__ */ jsx4(StatusNote, { children: "Your email address is verified." }),
      /* @__PURE__ */ jsx4(Button, { type: "button", onClick: carryOn, children: "Continue" })
    ] });
  }
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx4("h1", { className: H1, children: "Verify your email" }),
    /* @__PURE__ */ jsxs2("div", { className: FORM, children: [
      form.error && /* @__PURE__ */ jsx4(ErrorSummary, { error: form.error, search: "" }),
      failure ? /* @__PURE__ */ jsx4(Alert, { variant: "destructive", children: /* @__PURE__ */ jsxs2(AlertDescription, { children: [
        /* @__PURE__ */ jsx4("p", { children: "This verification link is invalid, has expired, or was already used." }),
        /* @__PURE__ */ jsx4("p", { children: /* @__PURE__ */ jsx4(Link2, { to: user ? AUTH_PATHS.verifyEmail : AUTH_PATHS.login, className: LINK, children: user ? "Get a new verification email" : "Log in to get a new verification email" }) })
      ] }) }) : /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsx4("p", { children: "Confirm your email address to finish setting up your account." }),
        /* @__PURE__ */ jsx4(Button, { type: "button", disabled: busy, onClick: () => void verify(), children: "Verify my email" })
      ] })
    ] })
  ] });
}
function CheckFailed({ message, onRetry }) {
  return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
    /* @__PURE__ */ jsx4("h1", { className: H1, children: "Couldn't check your link" }),
    /* @__PURE__ */ jsx4(ErrorNote, { children: message }),
    /* @__PURE__ */ jsx4(Button, { type: "button", onClick: onRetry, children: "Try again" })
  ] });
}
function ResetPasswordAction({ oobCode }) {
  const { service } = useAuth();
  const [email, setEmail] = useState4(null);
  const [invalid, setInvalid] = useState4(false);
  const [checkError, setCheckError] = useState4(null);
  const [attempt, setAttempt] = useState4(0);
  const [busy, setBusy] = useState4(false);
  const navigate = useNavigate2();
  const form = useFormError();
  useEffect3(() => {
    let live = true;
    service.verifyPasswordResetCode(oobCode).then(
      (e) => live && setEmail(e),
      (err) => {
        if (!live) return;
        if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
        else setCheckError(mapAuthError(errorCode(err)).message);
      }
    );
    return () => {
      live = false;
    };
  }, [service, oobCode, attempt]);
  function retryCheck() {
    setCheckError(null);
    setAttempt((n) => n + 1);
  }
  async function onSubmit(e) {
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
      void navigate(AUTH_PATHS.login, { replace: true, state: { email: email ?? void 0, passwordUpdated: true } });
    } catch (err) {
      if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
      else form.fail(err);
    } finally {
      setBusy(false);
    }
  }
  if (invalid) {
    return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
      /* @__PURE__ */ jsx4("h1", { className: H1, children: "Reset link expired" }),
      /* @__PURE__ */ jsx4(ErrorNote, { children: "This reset link is invalid, has expired, or was already used." }),
      /* @__PURE__ */ jsx4("p", { children: /* @__PURE__ */ jsx4(Link2, { to: AUTH_PATHS.forgotPassword, className: LINK, children: "Request a new reset link" }) })
    ] });
  }
  if (checkError) return /* @__PURE__ */ jsx4(CheckFailed, { message: checkError, onRetry: retryCheck });
  if (!email) return /* @__PURE__ */ jsx4("h1", { className: H1, children: "Checking your link\u2026" });
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx4("h1", { className: H1, children: "Choose a new password" }),
    /* @__PURE__ */ jsxs2("form", { className: FORM, onSubmit: (e) => void onSubmit(e), noValidate: true, children: [
      form.error && /* @__PURE__ */ jsx4(ErrorSummary, { error: form.error, search: "" }),
      /* @__PURE__ */ jsxs2("p", { children: [
        "Resetting the password for ",
        /* @__PURE__ */ jsx4("strong", { children: email }),
        "."
      ] }),
      /* @__PURE__ */ jsx4(Field, { label: "New password", id: "reset-password", name: "password", type: "password", autoComplete: "new-password", required: true, minLength: MIN_PASSWORD_LENGTH }),
      /* @__PURE__ */ jsxs2("p", { className: NOTE, children: [
        "At least ",
        MIN_PASSWORD_LENGTH,
        " characters. No other rules."
      ] }),
      /* @__PURE__ */ jsx4(Button, { type: "submit", disabled: busy, children: "Update password" })
    ] })
  ] });
}
var COPY = {
  verifyAndChangeEmail: { title: "Confirm your new email", button: "Confirm new email", doneTitle: "Email updated" },
  recoverEmail: { title: "Restore your email", button: "Restore this email", doneTitle: "Email restored" }
};
function EmailChangeAction({ mode, oobCode, continueUrl, hosts }) {
  const { service } = useAuth();
  const navigate = useNavigate2();
  const [info, setInfo] = useState4(null);
  const [invalid, setInvalid] = useState4(false);
  const [checkError, setCheckError] = useState4(null);
  const [attempt, setAttempt] = useState4(0);
  const [busy, setBusy] = useState4(false);
  const [signedIn, setSignedIn] = useState4(null);
  const [resetSent, setResetSent] = useState4(false);
  const form = useFormError();
  const next = resolveContinue(continueUrl, hosts);
  const copy = COPY[mode];
  useEffect3(() => {
    let live = true;
    service.checkEmailChangeCode(oobCode, mode).then(
      (i) => live && setInfo(i),
      (err) => {
        if (!live) return;
        if (EXPIRED.has(errorCode(err) ?? "")) setInvalid(true);
        else setCheckError(mapAuthError(errorCode(err)).message);
      }
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
    return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
      /* @__PURE__ */ jsx4("h1", { className: H1, children: "Link expired" }),
      /* @__PURE__ */ jsx4(ErrorNote, { children: "This link is invalid, has expired, or was already used." }),
      /* @__PURE__ */ jsx4("p", { children: /* @__PURE__ */ jsx4(Link2, { to: AUTH_PATHS.login, className: LINK, children: "Go to log in" }) })
    ] });
  }
  if (checkError) return /* @__PURE__ */ jsx4(CheckFailed, { message: checkError, onRetry: retryCheck });
  if (!info) return /* @__PURE__ */ jsx4("h1", { className: H1, children: "Checking your link\u2026" });
  if (signedIn !== null) {
    return /* @__PURE__ */ jsxs2("div", { className: STACK, children: [
      /* @__PURE__ */ jsx4("h1", { className: H1, children: copy.doneTitle }),
      mode === "verifyAndChangeEmail" ? /* @__PURE__ */ jsxs2(StatusNote, { children: [
        "Your email address is now ",
        /* @__PURE__ */ jsx4("strong", { children: info.email }),
        ".",
        signedIn ? "" : " Log in again with your new email."
      ] }) : /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsxs2(StatusNote, { children: [
          "Your email address is back to ",
          /* @__PURE__ */ jsx4("strong", { children: info.email }),
          "."
        ] }),
        /* @__PURE__ */ jsx4("p", { children: "If you didn't make this change, someone else may have access to your account. Reset your password to be safe." }),
        form.error && /* @__PURE__ */ jsx4(ErrorSummary, { error: form.error, search: "" }),
        resetSent ? /* @__PURE__ */ jsx4(StatusNote, { children: "Password reset email sent. Check your inbox." }) : /* @__PURE__ */ jsx4(Button, { type: "button", onClick: () => void resetPassword(), children: "Reset my password" })
      ] }),
      signedIn ? /* @__PURE__ */ jsx4(Button, { type: "button", onClick: carryOn, children: "Continue" }) : /* @__PURE__ */ jsx4("p", { children: /* @__PURE__ */ jsx4(Link2, { to: AUTH_PATHS.login, className: LINK, children: "Log in" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx4("h1", { className: H1, children: copy.title }),
    /* @__PURE__ */ jsxs2("div", { className: FORM, children: [
      form.error && /* @__PURE__ */ jsx4(ErrorSummary, { error: form.error, search: "" }),
      mode === "verifyAndChangeEmail" ? /* @__PURE__ */ jsxs2("p", { children: [
        "Change the email address on your account to ",
        /* @__PURE__ */ jsx4("strong", { children: info.email }),
        "."
      ] }) : /* @__PURE__ */ jsxs2("p", { children: [
        "Restore the email address on your account to ",
        /* @__PURE__ */ jsx4("strong", { children: info.email }),
        info.previousEmail ? /* @__PURE__ */ jsxs2(Fragment, { children: [
          " (currently ",
          info.previousEmail,
          ")"
        ] }) : null,
        "."
      ] }),
      /* @__PURE__ */ jsx4(Button, { type: "button", disabled: busy, onClick: () => void apply(), children: copy.button })
    ] })
  ] });
}
function ErrorNote({ children }) {
  return /* @__PURE__ */ jsx4(Alert, { variant: "destructive", children: /* @__PURE__ */ jsx4(AlertDescription, { children }) });
}

// src/auth/pages/ForgotPassword.tsx
import { useState as useState5 } from "react";
import { Link as Link3, useLocation as useLocation3 } from "react-router";
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var RESET_CONFIRMATION = "If an account exists for that address, we've emailed a link.";
var SHOWN = /* @__PURE__ */ new Set(["auth/network-request-failed", "auth/too-many-requests", "auth/invalid-email", "email/unavailable"]);
function ForgotPassword() {
  const { service } = useAuth();
  const { search } = useLocation3();
  const [busy, setBusy] = useState5(false);
  const [sent, setSent] = useState5(false);
  const form = useFormError();
  async function onSubmit(e) {
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
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx5("h1", { className: H1, children: "Reset your password" }),
    /* @__PURE__ */ jsxs3("form", { className: FORM, onSubmit: (e) => void onSubmit(e), noValidate: true, children: [
      form.error && /* @__PURE__ */ jsx5(ErrorSummary, { error: form.error, search }),
      sent && /* @__PURE__ */ jsx5(StatusNote, { children: RESET_CONFIRMATION }),
      /* @__PURE__ */ jsx5(Field, { label: "Email", id: "forgot-email", name: "email", type: "email", autoComplete: "email", required: true, ...form.fieldProps("email") }),
      /* @__PURE__ */ jsx5(Button, { type: "submit", disabled: busy, children: "Send reset link" }),
      /* @__PURE__ */ jsx5("p", { children: /* @__PURE__ */ jsx5(Link3, { to: withNext(AUTH_PATHS.login, search), className: LINK, children: "Back to log in" }) })
    ] })
  ] });
}

// src/auth/pages/Login.tsx
import { useEffect as useEffect4, useState as useState6 } from "react";
import { Link as Link4, useLocation as useLocation4 } from "react-router";
import { Fragment as Fragment3, jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function Login({ showSignup = true, showForgot = true, showGoogle = true, note }) {
  const { service } = useAuth();
  const { search, state } = useLocation4();
  const from = state ?? {};
  const [busy, setBusy] = useState6(false);
  const form = useFormError();
  useEffect4(() => {
    void service.consumeRedirectError().then((code) => {
      if (code) form.fail({ code });
    });
  }, [service]);
  async function onSubmit(e) {
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
  return /* @__PURE__ */ jsxs4(Fragment3, { children: [
    /* @__PURE__ */ jsx6("h1", { className: H1, children: "Log in" }),
    /* @__PURE__ */ jsxs4("form", { className: FORM, onSubmit: (e) => void onSubmit(e), noValidate: true, children: [
      from.passwordUpdated && !form.error && /* @__PURE__ */ jsx6(StatusNote, { children: "Password updated. Log in with your new password." }),
      form.error && /* @__PURE__ */ jsx6(ErrorSummary, { error: form.error, search }),
      /* @__PURE__ */ jsx6(Field, { label: "Email", id: "login-email", name: "email", type: "email", autoComplete: "email", defaultValue: from.email ?? "", required: true, ...form.fieldProps("email") }),
      /* @__PURE__ */ jsx6(Field, { label: "Password", id: "login-password", name: "password", type: "password", autoComplete: "current-password", required: true, ...form.fieldProps("password") }),
      /* @__PURE__ */ jsx6(Button, { type: "submit", disabled: busy, children: "Log in" }),
      showGoogle && /* @__PURE__ */ jsx6(Button, { type: "button", variant: "outline", disabled: busy, onClick: () => void google(), children: "Continue with Google" }),
      showForgot && /* @__PURE__ */ jsx6("p", { children: /* @__PURE__ */ jsx6(Link4, { to: withNext(AUTH_PATHS.forgotPassword, search), className: LINK, children: "Forgot your password?" }) }),
      note && /* @__PURE__ */ jsx6("p", { children: note }),
      showSignup && /* @__PURE__ */ jsxs4("p", { children: [
        "New here?",
        " ",
        /* @__PURE__ */ jsx6(Link4, { to: withNext(AUTH_PATHS.signup, search), className: LINK, children: "Create an account" })
      ] })
    ] })
  ] });
}

// src/auth/pages/Signup.tsx
import { useState as useState7 } from "react";
import { Link as Link5, useLocation as useLocation5 } from "react-router";
import { Fragment as Fragment4, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function Signup() {
  const { service } = useAuth();
  const { search } = useLocation5();
  const [busy, setBusy] = useState7(false);
  const [show, setShow] = useState7(false);
  const form = useFormError();
  async function onSubmit(e) {
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
      await service.signUp(email, password, readNext(search));
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
  return /* @__PURE__ */ jsxs5(Fragment4, { children: [
    /* @__PURE__ */ jsx7("h1", { className: H1, children: "Sign up" }),
    /* @__PURE__ */ jsxs5("form", { className: FORM, onSubmit: (e) => void onSubmit(e), noValidate: true, children: [
      form.error && /* @__PURE__ */ jsx7(ErrorSummary, { error: form.error, search }),
      /* @__PURE__ */ jsx7(Field, { label: "Email", id: "signup-email", name: "email", type: "email", autoComplete: "email", required: true, ...form.fieldProps("email") }),
      /* @__PURE__ */ jsx7(Field, { label: "Password", id: "signup-password", name: "password", type: show ? "text" : "password", autoComplete: "new-password", required: true, minLength: MIN_PASSWORD_LENGTH, ...form.fieldProps("password") }),
      /* @__PURE__ */ jsx7(Field, { label: "Confirm password", id: "signup-confirm", name: "confirm", type: show ? "text" : "password", autoComplete: "new-password", required: true, ...form.fieldProps("confirm") }),
      /* @__PURE__ */ jsx7(Button, { type: "button", variant: "outline", "aria-pressed": show, onClick: () => setShow((v) => !v), children: "Show passwords" }),
      /* @__PURE__ */ jsxs5("p", { className: NOTE, children: [
        "At least ",
        MIN_PASSWORD_LENGTH,
        " characters. No other rules."
      ] }),
      /* @__PURE__ */ jsx7(Button, { type: "submit", disabled: busy, children: "Create account" }),
      /* @__PURE__ */ jsx7(Button, { type: "button", variant: "outline", disabled: busy, onClick: () => void google(), children: "Continue with Google" }),
      /* @__PURE__ */ jsxs5("p", { children: [
        "Already have an account?",
        " ",
        /* @__PURE__ */ jsx7(Link5, { to: withNext(AUTH_PATHS.login, search), className: LINK, children: "Log in" })
      ] })
    ] })
  ] });
}

// src/auth/pages/VerifyEmail.tsx
import { useCallback as useCallback3, useEffect as useEffect5, useRef as useRef3, useState as useState8 } from "react";
import { useLocation as useLocation6, useNavigate as useNavigate3 } from "react-router";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
var RESEND_COOLDOWN_SECONDS = 60;
var cooldownUntil = /* @__PURE__ */ new Map();
var cooldownKey = (email) => email ?? "";
function remainingCooldown(email) {
  const until = cooldownUntil.get(cooldownKey(email)) ?? 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1e3));
}
function resetResendCooldowns() {
  cooldownUntil.clear();
}
function VerifyEmail() {
  const { service, user, signOut: authSignOut } = useAuth();
  const navigate = useNavigate3();
  const { search } = useLocation6();
  const next = readNext(search);
  const [leaveError, setLeaveError] = useState8(null);
  const [cooldown, setCooldown] = useState8(() => remainingCooldown(user?.email));
  const [note, setNote] = useState8(null);
  const [busy, setBusy] = useState8(false);
  const [checkingNow, setCheckingNow] = useState8(false);
  const form = useFormError();
  const checking = useRef3(false);
  useEffect5(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1e3);
    return () => clearTimeout(t);
  }, [cooldown]);
  const check = useCallback3(
    async (announce) => {
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
    [service]
  );
  useEffect5(() => {
    const onFocus = () => void check(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [check]);
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
      cooldownUntil.set(cooldownKey(user?.email), Date.now() + RESEND_COOLDOWN_SECONDS * 1e3);
    } catch (err) {
      form.fail(err);
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs6("section", { className: "text-center", "data-page": "verify-email", children: [
    /* @__PURE__ */ jsx8("h1", { className: H1, children: "Verify your email" }),
    /* @__PURE__ */ jsxs6("div", { className: "mx-auto mt-4 grid max-w-sm grid-cols-1 gap-4 break-words", children: [
      form.error && /* @__PURE__ */ jsx8(ErrorSummary, { error: form.error, search: "" }),
      /* @__PURE__ */ jsxs6("p", { children: [
        "Check your inbox \u2014 and your spam folder. We sent a verification link to ",
        /* @__PURE__ */ jsx8("strong", { children: user?.email }),
        "."
      ] }),
      note && /* @__PURE__ */ jsx8(StatusNote, { children: note }),
      leaveError && /* @__PURE__ */ jsx8(Alert, { variant: "destructive", className: "text-left", children: /* @__PURE__ */ jsx8(AlertDescription, { children: leaveError }) }),
      /* @__PURE__ */ jsx8(Button, { type: "button", disabled: checkingNow, onClick: () => void check(true), children: checkingNow ? "Checking\u2026" : "I've verified" }),
      /* @__PURE__ */ jsx8(Button, { type: "button", variant: "outline", disabled: busy || cooldown > 0, onClick: () => void resend(), children: cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email" }),
      /* @__PURE__ */ jsxs6("p", { children: [
        "Wrong address?",
        " ",
        /* @__PURE__ */ jsx8(Button, { type: "button", variant: "link", className: "px-1", onClick: () => void switchEmail(), children: "Use a different email" })
      ] })
    ] })
  ] });
}
export {
  AUTH_PATHS,
  AuthAction,
  AuthError,
  AuthProvider,
  EMAIL_PATTERN,
  ForgotPassword,
  Login,
  MIN_PASSWORD_LENGTH,
  PublicOnly,
  RESEND_COOLDOWN_SECONDS,
  RESET_CONFIRMATION,
  RequireUnverified,
  RequireVerified,
  Signup,
  VerifyEmail,
  errorCode,
  isPopupCancel,
  loginUrl,
  mapAuthError,
  phaseOf,
  readNext,
  resetResendCooldowns,
  resolveContinue,
  useAuth,
  useSignOut,
  verifyContinueUrl,
  verifyUrl,
  withNext
};
//# sourceMappingURL=index.js.map