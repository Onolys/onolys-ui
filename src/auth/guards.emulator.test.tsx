import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { here, localPart, renderAuthApp, testService } from "../../test/renderAuthApp";
import { useAuth } from "./AuthProvider";
import { RequireVerified } from "./guards";
import { signUpTestUser } from "./testing";

const h1 = (name: string) => screen.findByRole("heading", { level: 1, name });

describe("guards", () => {
  it.each(["/new", "/sessions", "/sessions/new", "/sessions/abc", "/sessions/abc/reports/1", "/settings"])(
    "unauthenticated %s -> /login?next=",
    async (path) => {
      const { router } = await renderAuthApp(path);
      await h1("Log in");
      expect(here(router)).toBe(`/login?next=${encodeURIComponent(path)}`);
    },
  );

  it("unauthenticated users can read /sample", async () => {
    const { router } = await renderAuthApp("/sample");
    await h1("Sample report");
    expect(here(router)).toBe("/sample");
  });

  it("/sample-report redirects to /sample", async () => {
    const { router } = await renderAuthApp("/sample-report");
    await h1("Sample report");
    expect(here(router)).toBe("/sample");
  });

  it("an unverified user cannot reach / and is sent to /verify-email", async () => {
    const { router, email } = await renderAuthApp("/", { user: { verified: false } });
    await h1("Verify your email");
    expect(here(router)).toBe("/verify-email?next=%2Fnew");
    expect(screen.queryByRole("heading", { level: 1, name: `Welcome ${localPart(email!)}` })).not.toBeInTheDocument();
  });

  it("an unverified user is sent from a deep link to /verify-email keeping next", async () => {
    const { router } = await renderAuthApp("/sessions/abc", { user: { verified: false } });
    await h1("Verify your email");
    expect(here(router)).toBe("/verify-email?next=%2Fsessions%2Fabc");
  });

  it("a verified user at / ends at /new", async () => {
    const { router, email } = await renderAuthApp("/", { user: { verified: true } });
    await h1(`Welcome ${localPart(email!)}`);
    expect(here(router)).toBe("/new");
  });

  it("a verified user reaches /sessions", async () => {
    await renderAuthApp("/sessions", { user: { verified: true } });
    await h1("Sessions");
  });

  it("a verified user on /login or /verify-email is sent on", async () => {
    const { email } = await renderAuthApp("/login", { user: { verified: true } });
    await h1(`Welcome ${localPart(email!)}`);
  });

  it("a signed-out user on /verify-email goes to /login", async () => {
    await renderAuthApp("/verify-email");
    await h1("Log in");
  });

  it("an unverified user can still open the sign-up/login pages' redirect to verify", async () => {
    const { router } = await renderAuthApp("/login", { user: { verified: false } });
    await h1("Verify your email");
    expect(here(router)).toBe("/verify-email");
  });
});

function SignOutButton() {
  const { signOut } = useAuth();
  return <button onClick={() => void signOut()}>Sign out</button>;
}

function ConcurrentSignOuts() {
  const { signOut } = useAuth();
  return <button onClick={() => void Promise.all([signOut(), signOut()])}>Sign out twice</button>;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

// The api client's 401 retry lives in the app (it needs the app's API); what the package owns is the forced token
// refresh on the real service and the sign-out the client triggers after a second 401.
describe("token refresh and sign-out", () => {
  it("a forced refresh on the real service yields a token and keeps the user signed in on the page", async () => {
    const service = testService();
    const { router } = await renderAuthApp("/settings", { service, user: { verified: true } });
    await h1("Settings");
    const before = await service.getToken();
    const refreshed = await service.getToken(true);
    expect(refreshed).toEqual(expect.any(String));
    expect(before).toEqual(expect.any(String));
    expect(here(router)).toBe("/settings");
    await h1("Settings");
  });

  it("a sign-out after a failed refresh clears the query cache and the guard sends to /login", async () => {
    const service = testService();
    const signOut = vi.spyOn(service, "signOut");
    const { router, queryClient } = await renderAuthApp("/settings", {
      service,
      user: { verified: true },
      routes: [
        { element: <RequireVerified />, children: [{ path: "/settings", element: <SignOutButton /> }] },
        { path: "/login", element: <h1>Log in</h1> },
      ],
    });
    queryClient.setQueryData(["secret"], { phi: "x" });
    await service.getToken(true);
    // What the app's api client does after a second 401: sign out through the provider.
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await h1("Log in");
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(here(router)).toBe("/login?next=%2Fsettings");
    expect(queryClient.getQueryData(["secret"])).toBeUndefined();
    expect(await service.getToken()).toBeNull();
  });

  it("concurrent sign-outs run once, then clear private data and the guard sends to /login", async () => {
    const service = testService();
    await signUpTestUser(service, { verified: true });
    const releaseSignOut = deferred();
    const originalSignOut = service.signOut;
    const signOut = vi.spyOn(service, "signOut").mockImplementation(async () => {
      await releaseSignOut.promise;
      await originalSignOut();
    });
    const { router, queryClient } = await renderAuthApp("/settings", {
      service,
      routes: [
        { element: <RequireVerified />, children: [{ path: "/settings", element: <ConcurrentSignOuts /> }] },
        { path: "/login", element: <h1>Log in</h1> },
      ],
    });
    queryClient.setQueryData(["secret"], { phi: "x" });
    fireEvent.click(await screen.findByRole("button", { name: "Sign out twice" }));
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    releaseSignOut.resolve();
    await h1("Log in");
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(here(router)).toBe("/login?next=%2Fsettings");
    expect(queryClient.getQueryData(["secret"])).toBeUndefined();
    expect(await service.getToken()).toBeNull();
  });
});

describe("guards while auth is loading (no SDK report yet)", () => {
  it.each(["/settings", "/login", "/verify-email"])("%s shows Loading and neither redirects nor renders content", async (path) => {
    const service = testService();
    vi.spyOn(service, "onAuthStateChanged").mockReturnValue(() => {});
    const { router } = await renderAuthApp(path, { service });
    expect(await screen.findByRole("status")).toHaveTextContent("Loading…");
    expect(here(router)).toBe(path);
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});

describe("guard redirects carry next", () => {
  it("signed-out /verify-email?next= goes to /login keeping next", async () => {
    const { router } = await renderAuthApp("/verify-email?next=%2Fsettings");
    await h1("Log in");
    expect(here(router)).toBe("/login?next=%2Fsettings");
  });

  it("verified /verify-email?next= goes to next", async () => {
    const { router } = await renderAuthApp("/verify-email?next=%2Fsettings", { user: { verified: true } });
    await h1("Settings");
    expect(here(router)).toBe("/settings");
  });

  it("unverified /login?next= goes to /verify-email keeping next", async () => {
    const { router } = await renderAuthApp("/login?next=%2Fsettings", { user: { verified: false } });
    await h1("Verify your email");
    expect(here(router)).toBe("/verify-email?next=%2Fsettings");
  });

  it("verified /login?next= goes to next", async () => {
    const { router } = await renderAuthApp("/login?next=%2Fsettings", { user: { verified: true } });
    await h1("Settings");
    expect(here(router)).toBe("/settings");
  });

  it("a signed-out visit to / goes to /login?next=/new", async () => {
    const { router } = await renderAuthApp("/");
    await h1("Log in");
    expect(here(router)).toBe("/login?next=%2Fnew");
  });
});
