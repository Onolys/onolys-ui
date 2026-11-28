/** Provider-neutral auth seam. Implemented by the Firebase service in `@onolys/common/auth/firebase`. */

export interface AuthUser {
  uid: string;
  email: string | null;
  /** Firebase profile name; null/empty when the account has none. */
  displayName: string | null;
  emailVerified: boolean;
}

/** Carries a Firebase-style `auth/...` code so one error mapper serves both implementations. */
export class AuthError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
}

export type EmailChangeKind = "verifyAndChangeEmail" | "recoverEmail";

export interface EmailChangeInfo {
  email: string;
  previousEmail: string | null;
}

export interface AuthService {
  /** Fires once with the initial state, then on every change. `null` = signed out. */
  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void;
  /** Creates the account and sends the verification email; its link returns to /verify-email, keeping `next` (a validated same-origin path). */
  signUp(email: string, password: string, next?: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  /** Error code of a failed redirect sign-in (mobile Google), reported once; undefined if none. */
  consumeRedirectError(): Promise<string | undefined>;
  /** Server-sent reset email (no auth). Rejects with `email/unavailable` or an `auth/...` code only. */
  sendPasswordReset(email: string): Promise<void>;
  /** Server-sent verification email for the signed-in user. Rejects with `email/unavailable` or an `auth/...` code. */
  sendVerificationEmail(next?: string): Promise<void>;
  /** Reload the user and force-refresh the ID token (the cached one lacks `email_verified`). */
  refreshUser(): Promise<AuthUser | null>;
  /** Consumes a verifyEmail action code; if signed in, refreshes the user so guards see `emailVerified`. */
  applyEmailVerification(oobCode: string): Promise<void>;
  /** Checks a verifyEmail code (does not consume it) and returns the email of the account it verifies. */
  checkEmailVerificationCode(oobCode: string): Promise<string>;
  /** Checks a password-reset code (does not consume it) and returns the account email. */
  verifyPasswordResetCode(oobCode: string): Promise<string>;
  confirmPasswordReset(oobCode: string, newPassword: string): Promise<void>;
  /** Checks a change-of-email code (does not consume it). `email` is the address the account will have after applying. */
  checkEmailChangeCode(oobCode: string, kind: EmailChangeKind): Promise<EmailChangeInfo>;
  /**
   * Consumes a verifyAndChangeEmail / recoverEmail code. Changing the email revokes the user's tokens, so
   * `signedIn` says whether the current user could still be refreshed (false = must log in again).
   */
  applyEmailChange(oobCode: string): Promise<{ signedIn: boolean }>;
  /** SDK-managed token; `forceRefresh` maps to `getIdToken(true)`. */
  getToken(forceRefresh?: boolean): Promise<string | null>;
  signOut(): Promise<void>;
}
