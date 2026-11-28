export { A as AUTH_PATHS } from '../constants-BvBCQRbA.js';
import * as React from 'react';
import { ReactNode } from 'react';
import { A as AuthService, a as AuthUser } from '../types-DJPQqTvY.js';
export { b as AuthError, E as EmailChangeInfo, c as EmailChangeKind } from '../types-DJPQqTvY.js';

type AuthPhase = "loading" | "signedOut" | "unverified" | "verified";
declare function phaseOf(status: "loading" | "ready", user: AuthUser | null): AuthPhase;
interface AuthContextValue {
    service: AuthService;
    /** `loading` until the SDK reports its initial state. */
    status: "loading" | "ready";
    user: AuthUser | null;
    /** Single source of truth for "who is looking at the app". */
    phase: AuthPhase;
    /** Signs out and drops every cached query (no PHI left in memory). Rejects if the SDK sign-out fails (cache kept). */
    signOut: () => Promise<void>;
}
declare function AuthProvider({ service, onSignOut, children, }: {
    service: AuthService;
    /** Extra app-specific cleanup when the user changes or signs out (prod passes `clearJobs`). */
    onSignOut?: () => void;
    children: ReactNode;
}): React.JSX.Element;
declare function useAuth(): AuthContextValue;

/** Signed-in and email-verified only. */
declare function RequireVerified(): React.JSX.Element;
/** Login / sign-up / forgot-password: signed-in users are sent on. */
declare function PublicOnly(): React.JSX.Element;
/** `/verify-email`: signed-in and unverified only. */
declare function RequireUnverified(): React.JSX.Element;

/** The one way to sign out: sign out, then land on a plain /login. A failure is returned, not thrown. */
declare function useSignOut(): {
    signOut: () => Promise<void>;
    error: string | null;
};

/** Plain-text mapping of auth error codes. No raw provider messages reach the UI. */
declare const MIN_PASSWORD_LENGTH = 8;
interface MappedAuthError {
    message: string;
    /** Email already in use: the form offers a link to log in. */
    offerLogin?: boolean;
    /** The form field the message is about, so it can be marked invalid. */
    field?: "email" | "password" | "confirm";
}
/** Simple shape check (something@host.tld); the server stays the authority. */
declare const EMAIL_PATTERN: RegExp;
/** The user closed the Google popup (or a second click replaced it): not an error worth showing. */
declare function isPopupCancel(err: unknown): boolean;
declare function mapAuthError(code: string | undefined): MappedAuthError;
declare function errorCode(err: unknown): string | undefined;

declare function readNext(search: string): string;
/** Append the validated `next` from `search` to `path` (omitted when it is just `/`). */
declare function withNext(path: string, search: string): string;
declare function loginUrl(pathname: string, search: string): string;
declare function verifyUrl(pathname: string, search: string): string;
/** Where the verification email's link returns after verifying; keeps `next` so the user lands where they were going. */
declare function verifyContinueUrl(origin: string, next?: string): string;

/**
 * In-app handler for Firebase email links (verify email, reset password, change of email, recover email). Firebase's hosted handler
 * fails for this project (the link carries a non-web API key), so the email action URL points here
 * and the page uses our own auth instance. The `apiKey` query param is ignored.
 */
type Continue = {
    kind: "path";
    path: string;
} | {
    kind: "external";
    href: string;
};
/** Never an open redirect: same-origin path, or an https URL on one of `allowedHosts`, else `/`. */
declare function resolveContinue(raw: string | null, allowedHosts: readonly string[], origin?: string): Continue;
interface AuthActionProps {
    /** Hostnames (besides this origin) a continue link may send the user back to. Compared lowercase. */
    allowedHosts?: readonly string[];
}
declare function AuthAction({ allowedHosts }?: AuthActionProps): React.JSX.Element;

/** Same confirmation for every email: no account enumeration. */
declare const RESET_CONFIRMATION = "If an account exists for that address, we've emailed a link.";
declare function ForgotPassword(): React.JSX.Element;

/** Router state set by the password-reset flow. */
interface LoginState {
    email?: string;
    passwordUpdated?: boolean;
}
/** `showSignup`/`showForgot`/`showGoogle` default on (prod app). Eval turns them off: accounts are operator-created there. `note` replaces them. */
declare function Login({ showSignup, showForgot, showGoogle, note }: {
    showSignup?: boolean;
    showForgot?: boolean;
    showGoogle?: boolean;
    note?: string;
}): React.JSX.Element;

declare function Signup(): React.JSX.Element;

declare const RESEND_COOLDOWN_SECONDS = 60;
/** Test hook: forget all cooldowns. */
declare function resetResendCooldowns(): void;
declare function VerifyEmail(): React.JSX.Element;

export { AuthAction, AuthProvider, AuthService, AuthUser, EMAIL_PATTERN, ForgotPassword, Login, MIN_PASSWORD_LENGTH, PublicOnly, RESEND_COOLDOWN_SECONDS, RESET_CONFIRMATION, RequireUnverified, RequireVerified, Signup, VerifyEmail, errorCode, isPopupCancel, loginUrl, mapAuthError, phaseOf, readNext, resetResendCooldowns, resolveContinue, useAuth, useSignOut, verifyContinueUrl, verifyUrl, withNext };
export type { AuthActionProps, AuthContextValue, AuthPhase, Continue, LoginState, MappedAuthError };
