import { EmailApi } from './firebase.js';
import { AuthService } from './index.js';

/**
 * `@onolys/common/auth/testing`: drive the real Firebase service against the Auth emulator in tests.
 * Plain functions over the Firebase SDK and the emulator's documented REST API; no fake service.
 * Run the tests under `firebase emulators:exec --only auth --project demo-onolys`. Needs the optional peer `firebase`.
 * Not part of the app runtime: it is the one source file the privacy guard skips (it talks to the emulator over HTTP).
 */

/** Where `firebase.json` puts the Auth emulator. */
declare const EMULATOR_URL = "http://127.0.0.1:9099";
/** A `demo-` project id keeps the emulator offline and away from real projects. */
declare const TEST_PROJECT_ID = "demo-onolys";
declare const TEST_PASSWORD = "longenough1";
type ActionKind = "verifyEmail" | "resetPassword" | "verifyAndChangeEmail" | "recoverEmail";
/**
 * The real Firebase service on the emulator. `emailApi` is `null` (no server routes in tests) unless given.
 * Its redirect check is skipped (`consumeRedirectError` answers `undefined`): jsdom cannot finish the SDK's own check.
 * Every service built in one test file shares one Firebase app: call `signOutTestServices()` after each test
 * and use `newTestEmail()`.
 */
declare function createTestAuthService(emailApi?: EmailApi | null): AuthService;
/** Signs out every service `createTestAuthService` built since the last call (put it in `afterEach`). */
declare function signOutTestServices(): Promise<void>;
/** A fresh lowercase address, unique across parallel test files. */
declare function newTestEmail(prefix?: string): string;
/** The newest action code of this kind for the account `email` (for an email change: the address the code was sent to). */
declare function readActionCode(kind: ActionKind, email: string): Promise<string>;
/**
 * Asks the emulator for an action code (what the app's email route does in production) and returns it.
 * `verifyEmail` and `verifyAndChangeEmail` need `service` signed in as `email`; `verifyAndChangeEmail` takes `newEmail`;
 * `recoverEmail` changes the signed-in account to `newEmail` and returns the code that restores `email`.
 */
declare function issueActionCode(service: AuthService, kind: ActionKind, email: string, opts?: {
    newEmail?: string;
}): Promise<string>;
/**
 * Signs up through the real service (it leaves the user signed in), and with `verified` follows the verification
 * code from the emulator. Returns the credentials.
 */
declare function signUpTestUser(service: AuthService, opts?: {
    email?: string;
    password?: string;
    verified?: boolean;
}): Promise<{
    email: string;
    password: string;
}>;
/**
 * Follows the verification link the way another browser tab would: the account is verified on the server,
 * and the signed-in SDK user only sees it after `refreshUser()`. `service` must be signed in as `email`.
 */
declare function clickVerificationLink(service: AuthService, email: string): Promise<void>;

export { EMULATOR_URL, TEST_PASSWORD, TEST_PROJECT_ID, clickVerificationLink, createTestAuthService, issueActionCode, newTestEmail, readActionCode, signOutTestServices, signUpTestUser };
export type { ActionKind };
