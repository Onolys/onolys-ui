import { AuthService } from './index.js';

interface FirebaseWebConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
}
/**
 * The app's server-sent email routes. Each call answers the HTTP status of the route (2xx = sent).
 * A rejection (network) or any non-2xx status, including 429, becomes `email/unavailable`.
 */
interface EmailApi {
    /** Verification email for the signed-in user; `getIdToken` yields their ID token for the route's bearer header. */
    sendVerification(getIdToken: () => Promise<string>, next?: string): Promise<number>;
    /** Password-reset email (no sign-in needed). */
    sendPasswordReset(email: string): Promise<number>;
}
interface FirebaseServiceOptions {
    /** The email routes, or `null` for none: both email flows then reject `email/unavailable` (sign-up still works). */
    emailApi: EmailApi | null;
    /** Auth emulator URL. Set only by tests (see `@onolys/common/auth/testing`); production passes none. */
    emulatorUrl?: string;
}
declare function createFirebaseAuthService(config: FirebaseWebConfig, options: FirebaseServiceOptions): AuthService;

export { createFirebaseAuthService };
export type { EmailApi, FirebaseServiceOptions, FirebaseWebConfig };
