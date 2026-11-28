/** `@onolys/common/auth`: provider-neutral sign-in (provider, guards, pages). Needs react-router and @tanstack/react-query. */
export { AUTH_PATHS } from "../constants";
export { AuthProvider, useAuth, phaseOf, type AuthContextValue, type AuthPhase } from "./AuthProvider";
export { PublicOnly, RequireUnverified, RequireVerified } from "./guards";
export { useSignOut } from "./useSignOut";
export { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, errorCode, isPopupCancel, mapAuthError, type MappedAuthError } from "./errors";
export { loginUrl, readNext, verifyContinueUrl, verifyUrl, withNext } from "./next";
export { AuthError, type AuthService, type AuthUser, type EmailChangeInfo, type EmailChangeKind } from "./types";
export { AuthAction, resolveContinue, type AuthActionProps, type Continue } from "./pages/AuthAction";
export { ForgotPassword, RESET_CONFIRMATION } from "./pages/ForgotPassword";
export { Login, type LoginState } from "./pages/Login";
export { Signup } from "./pages/Signup";
export { RESEND_COOLDOWN_SECONDS, VerifyEmail, resetResendCooldowns } from "./pages/VerifyEmail";
