/** Plain-text mapping of auth error codes. No raw provider messages reach the UI. */

export const MIN_PASSWORD_LENGTH = 8;

export interface MappedAuthError {
  message: string;
  /** Email already in use: the form offers a link to log in. */
  offerLogin?: boolean;
  /** The form field the message is about, so it can be marked invalid. */
  field?: "email" | "password" | "confirm";
}

/** Simple shape check (something@host.tld); the server stays the authority. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The user closed the Google popup (or a second click replaced it): not an error worth showing. */
export function isPopupCancel(err: unknown): boolean {
  const code = errorCode(err);
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

export function mapAuthError(code: string | undefined): MappedAuthError {
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

export function errorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    return (err as { code: string }).code;
  }
  return undefined;
}
