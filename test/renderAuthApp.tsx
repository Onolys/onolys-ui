import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { createMemoryRouter, Navigate, Outlet, RouterProvider, useParams, type RouteObject } from "react-router";
import {
  AuthAction,
  AuthProvider,
  ForgotPassword,
  Login,
  PublicOnly,
  RequireUnverified,
  RequireVerified,
  Signup,
  VerifyEmail,
  useAuth,
  type AuthService,
} from "../src/auth";
import { createTestAuthService, signOutTestServices, signUpTestUser } from "../src/auth/testing";
import type { EmailApi } from "../src/auth/firebase";

/**
 * Stands in for the app's email routes (the one thing the emulator does not run): answers `status`, or throws it.
 * `sendVerification` also reads the ID token, as the real route client does.
 */
export function stubEmailApi(status: number | Error = 202) {
  const answer = async () => {
    if (status instanceof Error) throw status;
    return status;
  };
  return {
    sendVerification: vi.fn<EmailApi["sendVerification"]>(async (getIdToken) => {
      await getIdToken();
      return answer();
    }),
    sendPasswordReset: vi.fn<EmailApi["sendPasswordReset"]>(async () => answer()),
  } satisfies EmailApi;
}

/** `user` part of an address: the stand-in app greets users with it. */
export const localPart = (email: string) => email.split("@")[0];

function Main() {
  return (
    <main>
      <Outlet />
    </main>
  );
}

function Welcome() {
  const { user } = useAuth();
  return <h1>Welcome {localPart(user?.email ?? "")}</h1>;
}

const Page = ({ title }: { title: string }) => <h1>{title}</h1>;
function Session() {
  const { id } = useParams();
  return <h1>Session {id}</h1>;
}

/** A small stand-in app: the package's pages and guards at their fixed paths, plus a few plain pages behind the guards. */
export function authRoutes(allowedHosts: readonly string[] = []): RouteObject[] {
  const pages: RouteObject[] = [
    {
      element: <PublicOnly />,
      children: [
        { path: "/login", element: <Login /> },
        { path: "/signup", element: <Signup /> },
        { path: "/forgot-password", element: <ForgotPassword /> },
      ],
    },
    { element: <RequireUnverified />, children: [{ path: "/verify-email", element: <VerifyEmail /> }] },
    { path: "/auth/action", element: <AuthAction allowedHosts={allowedHosts} /> },
    { path: "/sample", element: <Page title="Sample report" /> },
    { path: "/sample-report", element: <Navigate to="/sample" replace /> },
    { path: "/", element: <Navigate to="/new" replace /> },
    {
      element: <RequireVerified />,
      children: [
        { path: "/new", element: <Welcome /> },
        { path: "/sessions", element: <Page title="Sessions" /> },
        { path: "/sessions/new", element: <Page title="New session" /> },
        { path: "/sessions/:id", element: <Session /> },
        { path: "/sessions/:id/reports/:reportId", element: <Page title="Report" /> },
        { path: "/settings", element: <Page title="Settings" /> },
      ],
    },
  ];
  return [{ element: <Main />, children: pages }];
}

export interface RenderOptions {
  /** Defaults to a new emulator-backed service (`emailApi` null). */
  service?: AuthService;
  /** Email routes for the default service. */
  emailApi?: EmailApi | null;
  /** Start signed in: signs up through the real service (a fresh address unless `email` is given). Omit for signed out. */
  user?: { email?: string; verified: boolean };
  routes?: RouteObject[];
  allowedHosts?: readonly string[];
  onSignOut?: () => void;
}

// Every service in a test file shares one Firebase app: leave nobody signed in for the next test.
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await signOutTestServices();
});

/** A new emulator-backed service, signed out again after the test. */
export const testService = createTestAuthService;

export async function renderAuthApp(path: string, opts: RenderOptions = {}) {
  const service = opts.service ?? testService(opts.emailApi ?? null);
  const creds = opts.user ? await signUpTestUser(service, opts.user) : undefined;
  const queryClient = new QueryClient();
  const router = createMemoryRouter(opts.routes ?? authRoutes(opts.allowedHosts), { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider service={service} onSignOut={opts.onSignOut}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { router, service, queryClient, email: creds?.email };
}

export function here(router: { state: { location: { pathname: string; search: string } } }) {
  return router.state.location.pathname + router.state.location.search;
}
