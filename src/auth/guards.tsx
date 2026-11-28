import { Navigate, Outlet, useLocation } from "react-router";
import { AUTH_PATHS } from "../constants";
import { useAuth } from "./AuthProvider";
import { loginUrl, readNext, verifyUrl, withNext } from "./next";

function Loading() {
  return (
    <p role="status" aria-live="polite">
      Loading…
    </p>
  );
}

/** Signed-in and email-verified only. */
export function RequireVerified() {
  const { phase } = useAuth();
  const { pathname, search } = useLocation();
  if (phase === "loading") return <Loading />;
  if (phase === "signedOut") return <Navigate to={loginUrl(pathname, search)} replace />;
  if (phase === "unverified") return <Navigate to={verifyUrl(pathname, search)} replace />;
  return <Outlet />;
}

/** Login / sign-up / forgot-password: signed-in users are sent on. */
export function PublicOnly() {
  const { phase } = useAuth();
  const { search } = useLocation();
  if (phase === "loading") return <Loading />;
  if (phase === "verified") return <Navigate to={readNext(search)} replace />;
  if (phase === "unverified") return <Navigate to={withNext(AUTH_PATHS.verifyEmail, search)} replace />;
  return <Outlet />;
}

/** `/verify-email`: signed-in and unverified only. */
export function RequireUnverified() {
  const { phase } = useAuth();
  const { search } = useLocation();
  if (phase === "loading") return <Loading />;
  if (phase === "signedOut") return <Navigate to={withNext(AUTH_PATHS.login, search)} replace />;
  if (phase === "verified") return <Navigate to={readNext(search)} replace />;
  return <Outlet />;
}
