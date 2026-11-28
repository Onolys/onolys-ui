/**
 * `@onolys/common/auth/testing`: drive the real Firebase service against the Auth emulator in tests.
 * Plain functions over the Firebase SDK and the emulator's documented REST API; no fake service.
 * Run the tests under `firebase emulators:exec --only auth --project demo-onolys`. Needs the optional peer `firebase`.
 * Not part of the app runtime: it is the one source file the privacy guard skips (it talks to the emulator over HTTP).
 */
import { createFirebaseAuthService, type EmailApi } from "./firebase";
import type { AuthService } from "./types";

/** Where `firebase.json` puts the Auth emulator. */
export const EMULATOR_URL = "http://127.0.0.1:9099";
/** A `demo-` project id keeps the emulator offline and away from real projects. */
export const TEST_PROJECT_ID = "demo-onolys";
export const TEST_PASSWORD = "longenough1";

const API_KEY = "fake-api-key";

export type ActionKind = "verifyEmail" | "resetPassword" | "verifyAndChangeEmail" | "recoverEmail";

const REQUEST_TYPE: Record<ActionKind, string> = {
  verifyEmail: "VERIFY_EMAIL",
  resetPassword: "PASSWORD_RESET",
  verifyAndChangeEmail: "VERIFY_AND_CHANGE_EMAIL",
  recoverEmail: "RECOVER_EMAIL",
};

interface OobRecord {
  email: string;
  newEmail?: string;
  requestType: string;
  oobCode: string;
}

/**
 * The real Firebase service on the emulator. `emailApi` is `null` (no server routes in tests) unless given.
 * Every service built in one test file shares one Firebase app, so sign out between tests and use `newTestEmail()`.
 */
export function createTestAuthService(emailApi: EmailApi | null = null): AuthService {
  return createFirebaseAuthService(
    { apiKey: API_KEY, authDomain: `${TEST_PROJECT_ID}.firebaseapp.com`, projectId: TEST_PROJECT_ID, appId: "1:1:web:1" },
    { emailApi, emulatorUrl: EMULATOR_URL },
  );
}

let counter = 0;
/** A fresh lowercase address, unique across parallel test files. */
export function newTestEmail(prefix = "user"): string {
  return `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function emulator<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${EMULATOR_URL}${path}`, init);
  if (!response.ok) throw new Error(`Auth emulator ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Every action code the emulator holds, oldest first (documented `oobCodes` endpoint). */
async function oobCodes(): Promise<OobRecord[]> {
  return (await emulator<{ oobCodes: OobRecord[] }>(`/emulator/v1/projects/${TEST_PROJECT_ID}/oobCodes`)).oobCodes;
}

/** The newest action code of this kind for the account `email` (for an email change: the address the code was sent to). */
export async function readActionCode(kind: ActionKind, email: string): Promise<string> {
  const wanted = email.toLowerCase();
  const found = (await oobCodes()).filter((c) => c.requestType === REQUEST_TYPE[kind] && c.email.toLowerCase() === wanted);
  const latest = found.at(-1);
  if (!latest) throw new Error(`No ${kind} code in the emulator for ${email}`);
  return latest.oobCode;
}

/**
 * Asks the emulator for an action code (what the app's email route does in production) and returns it.
 * `verifyEmail` and `verifyAndChangeEmail` need `service` signed in as `email`; `verifyAndChangeEmail` takes `newEmail`;
 * `recoverEmail` changes the signed-in account to `newEmail` and returns the code that restores `email`.
 */
export async function issueActionCode(
  service: AuthService,
  kind: ActionKind,
  email: string,
  opts: { newEmail?: string } = {},
): Promise<string> {
  const post = (path: string, body: object) =>
    emulator(`/identitytoolkit.googleapis.com/v1/accounts:${path}?key=${API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const idToken = kind === "resetPassword" ? undefined : await service.getToken();
  if (kind !== "resetPassword" && !idToken) throw new Error("issueActionCode needs a signed-in service");
  if (kind === "recoverEmail") {
    if (!opts.newEmail) throw new Error("recoverEmail needs newEmail");
    await post("update", { idToken, email: opts.newEmail, returnSecureToken: true });
  } else {
    await post("sendOobCode", { requestType: REQUEST_TYPE[kind], email, idToken, newEmail: opts.newEmail });
  }
  return readActionCode(kind, email);
}

/**
 * Signs up through the real service (it leaves the user signed in), and with `verified` follows the verification
 * code from the emulator. Returns the credentials.
 */
export async function signUpTestUser(
  service: AuthService,
  opts: { email?: string; password?: string; verified?: boolean } = {},
): Promise<{ email: string; password: string }> {
  const email = opts.email ?? newTestEmail();
  const password = opts.password ?? TEST_PASSWORD;
  await service.signUp(email, password);
  if (opts.verified) {
    await service.applyEmailVerification(await issueActionCode(service, "verifyEmail", email));
  }
  return { email, password };
}

/**
 * Follows the verification link the way another browser tab would: the account is verified on the server,
 * and the signed-in SDK user only sees it after `refreshUser()`. `service` must be signed in as `email`.
 */
export async function clickVerificationLink(service: AuthService, email: string): Promise<void> {
  const oobCode = await issueActionCode(service, "verifyEmail", email);
  await emulator(`/identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ oobCode }),
  });
}
