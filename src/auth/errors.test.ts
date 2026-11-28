import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, errorCode, mapAuthError } from "./errors";

describe("mapAuthError", () => {
  it("asks for a fresh login when the session was revoked", () => {
    expect(mapAuthError("auth/user-token-expired").message).toMatch(/log in again/i);
  });
  it("maps wrong credentials to one plain message", () => {
    for (const code of ["auth/wrong-password", "auth/invalid-credential", "auth/user-not-found"]) {
      expect(mapAuthError(code).message).toBe("That email and password don't match. Try again or reset your password.");
    }
  });
  it("states the 8 character minimum for weak passwords", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(mapAuthError("auth/weak-password").message).toMatch(/at least 8 characters/);
  });
  it("offers login when the email is already in use", () => {
    const m = mapAuthError("auth/email-already-in-use");
    expect(m.offerLogin).toBe(true);
    expect(m.message).toMatch(/already exists/);
  });
  it("covers network, throttling, invalid email, cancelled popup and unknown codes", () => {
    expect(mapAuthError("auth/network-request-failed").message).toMatch(/connection/i);
    expect(mapAuthError("auth/too-many-requests").message).toMatch(/too many/i);
    expect(mapAuthError("auth/invalid-email").message).toMatch(/valid email/i);
    expect(mapAuthError("auth/popup-closed-by-user").message).toMatch(/cancelled/i);
    expect(mapAuthError("auth/whatever").message).toBe("Something went wrong. Please try again.");
    expect(mapAuthError(undefined).offerLogin).toBeFalsy();
  });
});

describe("action-code errors", () => {
  it("maps invalid/expired action codes to a plain message", () => {
    for (const c of ["auth/invalid-action-code", "auth/expired-action-code"]) {
      expect(mapAuthError(c).message).toMatch(/invalid, has expired, or was already used/);
    }
  });
});

describe("per-code messages", () => {
  const GENERIC = "Something went wrong. Please try again.";
  it.each([
    ["auth/missing-email", /enter your email/i, "email"],
    ["auth/missing-password", /enter your password/i, "password"],
    ["auth/invalid-email", /valid email/i, "email"],
    ["auth/weak-password", /at least 8 characters/i, "password"],
    ["auth/account-exists-with-different-credential", /has a password account\. Sign in with your password\./, undefined],
    ["auth/popup-blocked", /pop-?ups?/i, undefined],
    ["auth/operation-not-allowed", /isn't available/i, undefined],
    ["auth/internal-error", /having trouble/i, undefined],
    ["auth/quota-exceeded", /having trouble/i, undefined],
    ["auth/web-storage-unsupported", /cookies/i, undefined],
    ["auth/cancelled-popup-request", /cancelled/i, undefined],
    ["auth/requires-recent-login", /log in again/i, undefined],
    ["auth/user-disabled", /disabled/i, undefined],
  ])("%s has its own message", (code, re, field) => {
    const m = mapAuthError(code);
    expect(m.message).toMatch(re);
    expect(m.message).not.toBe(GENERIC);
    expect(m.field).toBe(field);
  });
  it("errorCode ignores a non-string code and non-objects", () => {
    expect(errorCode({ code: 42 })).toBeUndefined();
    expect(errorCode("auth/x")).toBeUndefined();
    expect(errorCode(null)).toBeUndefined();
    expect(errorCode({ code: "auth/x" })).toBe("auth/x");
  });
});

describe("email endpoint codes", () => {
  it("maps unavailable to the specified copy", () => {
    expect(mapAuthError("email/unavailable").message).toBe("We couldn't send the email. Try again in a moment.");
  });
});
