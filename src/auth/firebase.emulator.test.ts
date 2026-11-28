// Runs against the Firebase Auth emulator: `npm run test:auth` (under `firebase emulators:exec --only auth`).
import { afterEach, describe, expect, it, vi } from "vitest";
import { stubEmailApi } from "../../test/renderAuthApp";
import { clickVerificationLink, createTestAuthService, issueActionCode, newTestEmail, signUpTestUser, TEST_PASSWORD } from "./testing";
import type { AuthUser } from "./types";

// Every service below shares one Firebase app, so this one signs out whoever is left signed in.
const service = createTestAuthService();
afterEach(async () => {
  vi.restoreAllMocks();
  await service.signOut();
});

const emailApi = stubEmailApi;

function watch(svc = service) {
  const seen: (AuthUser | null)[] = [];
  svc.onAuthStateChanged((u) => seen.push(u));
  return seen;
}

describe("sign up, sign in, sign out", () => {
  it("signUp creates the account and leaves the user signed in; signIn works after signOut", async () => {
    const { email, password } = await signUpTestUser(service);
    expect(await service.getToken()).toEqual(expect.any(String));
    await service.signOut();
    expect(await service.getToken()).toBeNull();
    await service.signIn(email, password);
    expect(await service.getToken()).toEqual(expect.any(String));
    expect(await service.refreshUser()).toMatchObject({ email, emailVerified: false });
  });
  it("signIn with a wrong password rejects auth/wrong-password", async () => {
    const { email } = await signUpTestUser(service);
    await service.signOut();
    await expect(service.signIn(email, "wrong-password")).rejects.toMatchObject({ code: "auth/wrong-password" });
  });
  it("signOut reports a null user to listeners and clears the token", async () => {
    await signUpTestUser(service);
    const seen = watch();
    await vi.waitFor(() => expect(seen.at(-1)).not.toBeNull());
    await service.signOut();
    await vi.waitFor(() => expect(seen.at(-1)).toBeNull());
    expect(await service.getToken()).toBeNull();
  });
  it("two services on one config share the single emulator connection", async () => {
    const other = createTestAuthService();
    const { email } = await signUpTestUser(other);
    expect((await service.refreshUser())?.email).toBe(email);
  });
});

describe("firebase action-code methods", () => {
  it("applyEmailVerification applies the code, then reloads and force-refreshes the signed-in user", async () => {
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyEmail", email);
    const seen = watch();
    await service.applyEmailVerification(code);
    // The listeners saw the refreshed user without a separate refreshUser().
    expect(seen.at(-1)).toMatchObject({ email, emailVerified: true });
  });
  it("applyEmailVerification with nobody signed in only applies the code", async () => {
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyEmail", email);
    await service.signOut();
    await service.applyEmailVerification(code);
    expect(await service.getToken()).toBeNull();
    await expect(service.checkEmailVerificationCode(code)).rejects.toMatchObject({ code: "auth/invalid-action-code" }); // consumed
  });
  it("propagates Firebase errors (auth/invalid-action-code)", async () => {
    await expect(service.applyEmailVerification("not-a-code")).rejects.toMatchObject({ code: "auth/invalid-action-code" });
  });
  it("checkEmailVerificationCode returns the account email without consuming the code", async () => {
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyEmail", email);
    expect(await service.checkEmailVerificationCode(code)).toBe(email);
    expect(await service.checkEmailVerificationCode(code)).toBe(email);
  });
  it("checkEmailVerificationCode rejects a code of another kind", async () => {
    const { email } = await signUpTestUser(service);
    await service.signOut();
    const reset = await issueActionCode(service, "resetPassword", email);
    await expect(service.checkEmailVerificationCode(reset)).rejects.toMatchObject({ code: "auth/invalid-action-code" });
  });
  it("verifyPasswordResetCode returns the email; confirmPasswordReset sets the new password", async () => {
    const { email, password } = await signUpTestUser(service);
    await service.signOut();
    const code = await issueActionCode(service, "resetPassword", email);
    expect(await service.verifyPasswordResetCode(code)).toBe(email);
    await service.confirmPasswordReset(code, "newpassword1");
    await expect(service.signIn(email, password)).rejects.toMatchObject({ code: "auth/wrong-password" });
    await service.signIn(email, "newpassword1");
    await expect(service.verifyPasswordResetCode(code)).rejects.toMatchObject({ code: "auth/invalid-action-code" }); // used
  });
});

describe("firebase email-change action codes", () => {
  it("checkEmailChangeCode returns email and previousEmail without applying", async () => {
    const { email } = await signUpTestUser(service);
    const newEmail = newTestEmail("new");
    const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail });
    expect(await service.checkEmailChangeCode(code, "verifyAndChangeEmail")).toEqual({ email: newEmail, previousEmail: email });
    expect((await service.refreshUser())?.email).toBe(email); // not applied
    expect(await service.checkEmailChangeCode(code, "verifyAndChangeEmail")).toEqual({ email: newEmail, previousEmail: email });
  });
  it("checkEmailChangeCode returns the address a recoverEmail code restores", async () => {
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "recoverEmail", email, { newEmail: newTestEmail("moved") });
    expect(await service.checkEmailChangeCode(code, "recoverEmail")).toMatchObject({ email });
  });
  it("checkEmailChangeCode rejects a code of a different operation as invalid", async () => {
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail: newTestEmail("new") });
    await expect(service.checkEmailChangeCode(code, "recoverEmail")).rejects.toMatchObject({ code: "auth/invalid-action-code" });
  });
  it("checkEmailChangeCode propagates Firebase errors", async () => {
    await expect(service.checkEmailChangeCode("not-a-code", "recoverEmail")).rejects.toMatchObject({ code: "auth/invalid-action-code" });
  });
  it("applyEmailChange applies, then reloads and refreshes the user: signedIn true", async () => {
    const { email } = await signUpTestUser(service);
    const newEmail = newTestEmail("new");
    const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail });
    const seen = watch();
    expect(await service.applyEmailChange(code)).toEqual({ signedIn: true });
    expect(seen.at(-1)).toMatchObject({ email: newEmail });
  });
  it("applyEmailChange does not claim signedIn for a different account than the code's", async () => {
    const other = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyAndChangeEmail", other.email, { newEmail: newTestEmail("new") });
    await service.signOut();
    const me = await signUpTestUser(service);
    expect(await service.applyEmailChange(code)).toEqual({ signedIn: false });
    expect((await service.refreshUser())?.email).toBe(me.email); // the code changed the other account
  });
  it("applyEmailChange stays signedIn when the current user matches the code's account", async () => {
    const { email } = await signUpTestUser(service, { email: newTestEmail("Mixed.Case").toUpperCase() });
    const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail: newTestEmail("new") });
    expect(await service.applyEmailChange(code)).toEqual({ signedIn: true });
  });
  it("applyEmailChange with nobody signed in is signedIn false", async () => {
    const { email } = await signUpTestUser(service);
    const newEmail = newTestEmail("new");
    const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail });
    await service.signOut();
    expect(await service.applyEmailChange(code)).toEqual({ signedIn: false });
    await service.signIn(newEmail, TEST_PASSWORD); // the change went through
  });
  it("applyEmailChange propagates apply errors", async () => {
    await expect(service.applyEmailChange("not-a-code")).rejects.toMatchObject({ code: "auth/invalid-action-code" });
  });
});

describe("firebase signUp", () => {
  it("still resolves when the verification email cannot be sent (VerifyEmail has Resend)", async () => {
    const api = emailApi(503);
    const svc = createTestAuthService(api);
    await expect(svc.signUp(newTestEmail(), TEST_PASSWORD)).resolves.toBeUndefined();
    expect(api.sendVerification).toHaveBeenCalledOnce();
    expect(await svc.getToken()).toEqual(expect.any(String)); // the user is signed in
  });
  it("still resolves when the network is down", async () => {
    const api = emailApi(new TypeError("Failed to fetch"));
    await expect(createTestAuthService(api).signUp(newTestEmail(), TEST_PASSWORD)).resolves.toBeUndefined();
    expect(api.sendVerification).toHaveBeenCalledOnce();
  });
  it("sends the verification email exactly once, only at sign-up, via the API with the ID token", async () => {
    const tokens: string[] = [];
    const api = {
      sendVerification: vi.fn(async (getIdToken: () => Promise<string>) => {
        tokens.push(await getIdToken());
        return 202;
      }),
      sendPasswordReset: vi.fn(async () => 202),
    };
    const svc = createTestAuthService(api);
    await svc.signUp(newTestEmail(), TEST_PASSWORD, "/settings");
    expect(api.sendVerification).toHaveBeenCalledOnce();
    expect(api.sendVerification).toHaveBeenCalledWith(expect.any(Function), "/settings");
    expect(tokens).toEqual([await svc.getToken()]);
    expect(api.sendPasswordReset).not.toHaveBeenCalled();
  });
  it("existing email + right password signs in instead, without sending another verification email", async () => {
    const api = emailApi();
    const svc = createTestAuthService(api);
    const email = newTestEmail();
    await svc.signUp(email, TEST_PASSWORD);
    await svc.signOut();
    await expect(svc.signUp(email, TEST_PASSWORD)).resolves.toBeUndefined();
    expect(api.sendVerification).toHaveBeenCalledOnce();
    expect(await svc.refreshUser()).toMatchObject({ email });
  });
  it("existing email + wrong password still reports email-already-in-use", async () => {
    const { email } = await signUpTestUser(service);
    await service.signOut();
    await expect(service.signUp(email, "different-password")).rejects.toMatchObject({ code: "auth/email-already-in-use" });
    expect(await service.getToken()).toBeNull();
  });
  it("other create failures are not retried as sign-in", async () => {
    const email = newTestEmail();
    await expect(service.signUp(email, "123")).rejects.toMatchObject({ code: "auth/weak-password" });
    expect(await service.getToken()).toBeNull();
    await expect(service.signIn(email, "123")).rejects.toMatchObject({ code: "auth/user-not-found" }); // no account was created
  });
});

describe("firebase email endpoints", () => {
  it("sendVerificationEmail calls the API with the current user's ID token and next", async () => {
    const tokens: string[] = [];
    const api = {
      sendVerification: vi.fn(async (getIdToken: () => Promise<string>) => {
        tokens.push(await getIdToken());
        return 202;
      }),
      sendPasswordReset: vi.fn(async () => 202),
    };
    const svc = createTestAuthService(api);
    await signUpTestUser(svc);
    api.sendVerification.mockClear();
    tokens.length = 0;
    await svc.sendVerificationEmail("/x");
    expect(api.sendVerification).toHaveBeenCalledWith(expect.any(Function), "/x");
    expect(tokens).toEqual([await svc.getToken()]);
  });
  it("sendVerificationEmail with nobody signed in rejects without calling the API", async () => {
    const api = emailApi();
    await expect(createTestAuthService(api).sendVerificationEmail()).rejects.toMatchObject({ code: "auth/requires-recent-login" });
    expect(api.sendVerification).not.toHaveBeenCalled();
  });
  it.each([429, 503, 500])("sendVerificationEmail maps %i to email/unavailable (no separate rate-limit code)", async (status) => {
    const svc = createTestAuthService(emailApi(status));
    await signUpTestUser(svc);
    await expect(svc.sendVerificationEmail()).rejects.toMatchObject({ code: "email/unavailable" });
  });
  it("sendVerificationEmail maps a network failure to email/unavailable", async () => {
    const svc = createTestAuthService(emailApi(new TypeError("Failed to fetch")));
    await signUpTestUser(svc);
    await expect(svc.sendVerificationEmail()).rejects.toMatchObject({ code: "email/unavailable" });
  });
  it("sendPasswordReset passes only the email (no ID token)", async () => {
    const api = emailApi();
    const svc = createTestAuthService(api);
    await signUpTestUser(svc);
    await svc.sendPasswordReset("a@b.co");
    expect(api.sendPasswordReset).toHaveBeenCalledWith("a@b.co");
    expect(api.sendVerification).toHaveBeenCalledOnce(); // sign-up's only
  });
  it("sendPasswordReset works signed out and resolves the same for any 202", async () => {
    await expect(createTestAuthService(emailApi()).sendPasswordReset("nobody@b.co")).resolves.toBeUndefined();
  });
  it.each([429, 503])("sendPasswordReset maps %i to email/unavailable", async (status) => {
    await expect(createTestAuthService(emailApi(status)).sendPasswordReset("a@b.co")).rejects.toMatchObject({ code: "email/unavailable" });
  });
  it("sendPasswordReset maps a network failure to email/unavailable", async () => {
    await expect(createTestAuthService(emailApi(new TypeError("Failed to fetch"))).sendPasswordReset("a@b.co")).rejects.toMatchObject({
      code: "email/unavailable",
    });
  });
  it("refreshUser sees an email verified through the link (another tab)", async () => {
    const { email } = await signUpTestUser(service);
    await clickVerificationLink(service, email);
    expect(await service.refreshUser()).toMatchObject({ email, emailVerified: true });
  });
});

describe("createFirebaseAuthService without emailApi", () => {
  it("password reset and verification email reject with email/unavailable and never call the network", async () => {
    const svc = createTestAuthService(null);
    await signUpTestUser(svc);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(svc.sendPasswordReset("a@b.co")).rejects.toMatchObject({ code: "email/unavailable" });
    await expect(svc.sendVerificationEmail()).rejects.toMatchObject({ code: "email/unavailable" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("sign-in and sign-up still work (sign-up tolerates the missing verification email)", async () => {
    const svc = createTestAuthService(null);
    const email = newTestEmail();
    await expect(svc.signUp(email, TEST_PASSWORD)).resolves.toBeUndefined();
    await svc.signOut();
    await svc.signIn(email, TEST_PASSWORD);
    expect(await svc.getToken()).toEqual(expect.any(String));
  });
  it("a supplied emailApi is used for the email routes", async () => {
    const api = emailApi();
    await createTestAuthService(api).sendPasswordReset("a@b.co");
    expect(api.sendPasswordReset).toHaveBeenCalledWith("a@b.co");
  });
});
