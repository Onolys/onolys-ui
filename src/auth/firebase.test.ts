// The cases the emulator cannot produce (a revoked session mid-flow, sign-in errors that follow an
// "email already in use", a failed redirect result): the Firebase SDK is mocked here, nothing else.
// Everything the emulator can express is in firebase.emulator.test.ts.
import { beforeEach, describe, expect, it, vi } from "vitest";

const currentUser = { reload: vi.fn(), getIdToken: vi.fn(), emailVerified: true, uid: "u", email: "a@b.co" };
const auth = { currentUser: currentUser as unknown | null, authStateReady: () => Promise.resolve(), emulatorConfig: null };
const m = {
  applyActionCode: vi.fn(),
  checkActionCode: vi.fn(),
  reload: vi.fn(),
  getRedirectResult: vi.fn(),
  createUser: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
};

vi.mock("firebase/app", () => ({ initializeApp: () => ({}) }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class {},
  getAuth: () => auth,
  connectAuthEmulator: vi.fn(),
  getRedirectResult: (...a: unknown[]) => m.getRedirectResult(...a),
  onIdTokenChanged: vi.fn(),
  applyActionCode: (...a: unknown[]) => m.applyActionCode(...a),
  checkActionCode: (...a: unknown[]) => m.checkActionCode(...a),
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
  reload: (...a: unknown[]) => m.reload(...a),
  createUserWithEmailAndPassword: (...a: unknown[]) => m.createUser(...a),
  signInWithEmailAndPassword: (...a: unknown[]) => m.signIn(...a),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: (...a: unknown[]) => m.signOut(...a),
}));

import { createFirebaseAuthService } from "./firebase";

const make = () => createFirebaseAuthService({ apiKey: "AIzaSy", authDomain: "d", projectId: "p", appId: "a" }, { emailApi: null });

beforeEach(() => {
  vi.resetAllMocks();
  auth.currentUser = currentUser;
  currentUser.getIdToken.mockResolvedValue("t");
  m.getRedirectResult.mockResolvedValue(null);
});

describe("firebase applyEmailChange when the change revoked the session", () => {
  it("reports signedIn false when the token was revoked by the change", async () => {
    m.reload.mockRejectedValue({ code: "auth/user-token-expired" });
    expect(await make().applyEmailChange("oob")).toEqual({ signedIn: false });
    expect(m.applyActionCode).toHaveBeenCalledOnce();
  });
  it("signs out when the session cannot be refreshed", async () => {
    m.reload.mockRejectedValue({ code: "auth/user-token-expired" });
    await make().applyEmailChange("oob");
    expect(m.signOut).toHaveBeenCalledWith(auth);
  });
});

describe("firebase signUp with an existing email", () => {
  it.each(["auth/wrong-password", "auth/user-not-found"])("existing email + %s sign-in error reports email-already-in-use", async (code) => {
    m.createUser.mockRejectedValue({ code: "auth/email-already-in-use" });
    m.signIn.mockRejectedValue({ code });
    await expect(make().signUp("a@b.co", "password1")).rejects.toMatchObject({ code: "auth/email-already-in-use" });
  });
  it.each(["auth/too-many-requests", "auth/network-request-failed", "auth/user-disabled", "auth/internal-error"])(
    "existing email + %s sign-in error surfaces that error, not email-already-in-use",
    async (code) => {
      m.createUser.mockRejectedValue({ code: "auth/email-already-in-use" });
      m.signIn.mockRejectedValue({ code });
      await expect(make().signUp("a@b.co", "password1")).rejects.toMatchObject({ code });
    },
  );
});

describe("firebase redirect sign-in result", () => {
  it("reports the failure code once instead of swallowing it", async () => {
    m.getRedirectResult.mockRejectedValue({ code: "auth/account-exists-with-different-credential" });
    const svc = make();
    expect(await svc.consumeRedirectError()).toBe("auth/account-exists-with-different-credential");
    expect(await svc.consumeRedirectError()).toBeUndefined();
  });
  it("reports nothing when there was no redirect or it succeeded", async () => {
    expect(await make().consumeRedirectError()).toBeUndefined();
  });
});
