import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { here, localPart, renderAuthApp, stubEmailApi, testService } from "../../test/renderAuthApp";
import { resetResendCooldowns } from "./pages/VerifyEmail";
import { clickVerificationLink, newTestEmail, signUpTestUser, TEST_PASSWORD } from "./testing";

const h1 = (name: string) => screen.findByRole("heading", { level: 1, name });

describe("sign up", () => {
  it("creates an account, sends verification and lands on /verify-email keeping ?next=", async () => {
    const user = userEvent.setup();
    const api = stubEmailApi();
    const { router } = await renderAuthApp("/signup?next=%2Fsettings", { emailApi: api });
    await h1("Sign up");
    await user.type(screen.getByLabelText("Email"), newTestEmail("new"));
    await user.type(screen.getByLabelText("Password"), TEST_PASSWORD);
    await user.type(screen.getByLabelText("Confirm password"), TEST_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await h1("Verify your email");
    expect(api.sendVerification).toHaveBeenCalledTimes(1);
    expect(here(router)).toBe("/verify-email?next=%2Fsettings");
    expect(api.sendVerification.mock.calls.map(([, next]) => next)).toEqual(["/settings"]);
  });

  it("blocks passwords under 8 characters with an error summary and does not call the service", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/signup");
    const signUp = vi.spyOn(service, "signUp");
    await h1("Sign up");
    await user.type(screen.getByLabelText("Email"), newTestEmail("new"));
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("at least 8 characters");
    expect(alert).toHaveFocus();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("asks for an email (no service call) when it is empty or malformed, and marks the field invalid", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/signup");
    const signUp = vi.spyOn(service, "signUp");
    await h1("Sign up");
    await user.type(screen.getByLabelText("Password"), TEST_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your email/i);
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid");
    for (const bad of ["foo", "a@b"]) {
      await user.clear(email);
      await user.type(email, bad);
      await user.click(screen.getByRole("button", { name: "Create account" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/valid email/i);
    }
    expect(signUp).not.toHaveBeenCalled();
  });

  it("marks the password field invalid for a short password", async () => {
    const user = userEvent.setup();
    await renderAuthApp("/signup");
    await h1("Sign up");
    await user.type(screen.getByLabelText("Email"), newTestEmail("new"));
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
  });

  it("requires the confirmation to match and flags the field", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/signup");
    const signUp = vi.spyOn(service, "signUp");
    await h1("Sign up");
    await user.type(screen.getByLabelText("Email"), newTestEmail("new"));
    await user.type(screen.getByLabelText("Password"), TEST_PASSWORD);
    await user.type(screen.getByLabelText("Confirm password"), "longenough2");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords don't match");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("aria-invalid", "true");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("toggles password visibility with an accessible button", async () => {
    const user = userEvent.setup();
    await renderAuthApp("/signup");
    await h1("Sign up");
    const toggle = screen.getByRole("button", { name: "Show passwords" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("type", "text");
  });

  it("offers login when the email is already in use", async () => {
    const user = userEvent.setup();
    const service = testService();
    const { email } = await signUpTestUser(service, { password: TEST_PASSWORD });
    await service.signOut();
    await renderAuthApp("/signup?next=%2Fsettings", { service });
    await h1("Sign up");
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), "differentpass1");
    await user.type(screen.getByLabelText("Confirm password"), "differentpass1");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
    const link = screen.getByRole("link", { name: "Log in instead" });
    expect(link).toHaveAttribute("href", "/login?next=%2Fsettings");
  });

  it("continues with Google", async () => {
    const user = userEvent.setup();
    const service = testService();
    // jsdom has no popup: the Google step is stood in for by signing in the verified account Google would return.
    const { email, password } = await signUpTestUser(service, { verified: true });
    await service.signOut();
    const google = vi.spyOn(service, "signInWithGoogle").mockImplementation(() => service.signIn(email, password));
    await renderAuthApp("/signup", { service });
    await h1("Sign up");
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(google).toHaveBeenCalledTimes(1));
    await h1(`Welcome ${localPart(email)}`); // Google accounts arrive verified
  });
});

describe("log in", () => {
  it("keeps account creation and password recovery on the app login", async () => {
    await renderAuthApp("/login?next=%2Fsettings");
    await h1("Log in");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup?next=%2Fsettings");
    expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/forgot-password?next=%2Fsettings");
  });

  it("signs in and goes to ?next=", async () => {
    const user = userEvent.setup();
    const service = testService();
    const { email } = await signUpTestUser(service, { verified: true });
    await service.signOut();
    const { router } = await renderAuthApp("/login?next=%2Fsettings", { service });
    await h1("Log in");
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), TEST_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await h1("Settings");
    expect(here(router)).toBe("/settings");
  });

  it("shows a plain-text error for a wrong password", async () => {
    const user = userEvent.setup();
    const service = testService();
    const { email } = await signUpTestUser(service);
    await service.signOut();
    await renderAuthApp("/login", { service });
    await h1("Log in");
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), "wrongwrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That email and password don't match");
  });

  it("asks for email, then password, instead of calling the service on an empty form", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/login");
    const signIn = vi.spyOn(service, "signIn");
    await h1("Log in");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your email/i);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    await user.type(screen.getByLabelText("Email"), newTestEmail());
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your password/i);
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows the error of a failed Google redirect sign-in", async () => {
    const service = testService();
    vi.spyOn(service, "consumeRedirectError").mockResolvedValue("auth/account-exists-with-different-credential");
    await renderAuthApp("/login", { service });
    expect(await screen.findByRole("alert")).toHaveTextContent("This email has a password account. Sign in with your password.");
  });

  it("links to sign up and forgot password, carrying ?next=", async () => {
    await renderAuthApp("/login?next=%2Fsettings");
    await h1("Log in");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup?next=%2Fsettings");
    expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/forgot-password?next=%2Fsettings");
  });

  it("ignores an unsafe ?next= after sign-in", async () => {
    const { router, email } = await renderAuthApp("/login?next=%2F%2Fevil.com", { user: { verified: true } });
    await h1(`Welcome ${localPart(email!)}`);
    expect(here(router)).toBe("/new");
  });
});

describe("forgot password", () => {
  const CONFIRM = "If an account exists for that address, we've emailed a link.";

  it("shows the same confirmation for a known and an unknown email", async () => {
    const api = stubEmailApi();
    const service = testService(api);
    const { email: known } = await signUpTestUser(service);
    await service.signOut();
    const unknown = newTestEmail("nobody");
    const texts: string[] = [];
    for (const email of [known, unknown]) {
      const user = userEvent.setup();
      await renderAuthApp("/forgot-password", { service });
      await h1("Reset your password");
      await user.type(screen.getByLabelText("Email"), email);
      await user.click(screen.getByRole("button", { name: "Send reset link" }));
      texts.push((await screen.findByRole("status")).textContent ?? "");
      cleanup();
    }
    expect(texts[0]).toBe(CONFIRM);
    expect(texts[1]).toBe(CONFIRM);
    expect(api.sendPasswordReset.mock.calls.map(([email]) => email)).toEqual([known, unknown]);
  });
});

describe("forgot password errors", () => {
  it("clears the confirmation when a later submit fails, so success and error never show together", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/forgot-password", { emailApi: stubEmailApi() });
    await h1("Reset your password");
    await user.type(screen.getByLabelText("Email"), newTestEmail("nobody"));
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    await screen.findByRole("status");
    vi.spyOn(service, "sendPasswordReset").mockRejectedValueOnce({ code: "auth/network-request-failed" });
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the email/unavailable copy and no confirmation", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/forgot-password");
    await h1("Reset your password");
    vi.spyOn(service, "sendPasswordReset").mockRejectedValueOnce({ code: "email/unavailable" });
    await user.type(screen.getByLabelText("Email"), "a@b.co");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't send the email. Try again in a moment.");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("rejects a malformed email on the client without the confirmation or a service call", async () => {
    const user = userEvent.setup();
    const api = stubEmailApi();
    await renderAuthApp("/forgot-password", { emailApi: api });
    await h1("Reset your password");
    await user.type(screen.getByLabelText("Email"), "foo");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("status")).toBeNull();
    expect(api.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("shows the valid-email message when the provider says invalid-email, not the confirmation", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/forgot-password");
    await h1("Reset your password");
    vi.spyOn(service, "sendPasswordReset").mockRejectedValueOnce({ code: "auth/invalid-email" });
    await user.type(screen.getByLabelText("Email"), "a@b.co");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email");
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("verify email", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetResendCooldowns();
  });

  it("mentions the spam folder", async () => {
    const { email } = await renderAuthApp("/verify-email", { user: { verified: false } });
    await h1("Verify your email");
    expect(screen.getByText(/spam folder/i)).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByText(email!)).toBeInTheDocument();
  });

  it("offers no Sign out; Use a different email clears the session and goes to /signup", async () => {
    const { service, router } = await renderAuthApp("/verify-email", { user: { verified: false } });
    await h1("Verify your email");
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
    const spy = vi.spyOn(service, "signOut");
    await userEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    await h1("Sign up");
    expect(spy).toHaveBeenCalled();
    expect(here(router)).toBe("/signup");
  });

  it("Resend sends mail then locks for 60 seconds with a countdown", async () => {
    const api = stubEmailApi();
    await renderAuthApp("/verify-email", { emailApi: api, user: { verified: false } });
    await h1("Verify your email");
    api.sendVerification.mockClear();
    vi.useFakeTimers();
    // RTL's async wrapper deadlocks on vitest fake timers, so drive the click synchronously.
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend email" })));
    expect(api.sendVerification).toHaveBeenCalledTimes(1);
    const locked = screen.getByRole("button", { name: /Resend in 60s/ });
    expect(locked).toBeDisabled();
    for (let i = 0; i < 30; i++) await act(async () => void vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: /Resend in 30s/ })).toBeDisabled();
    for (let i = 0; i < 30; i++) await act(async () => void vi.advanceTimersByTime(1000));
    const again = screen.getByRole("button", { name: "Resend email" });
    expect(again).toBeEnabled();
    expect(api.sendVerification).toHaveBeenCalledTimes(1);
  });

  it("\"I've verified\" force-refreshes the token and continues to ?next=", async () => {
    const user = userEvent.setup();
    const { service, router, email } = await renderAuthApp("/verify-email?next=%2Fsettings", { user: { verified: false } });
    await h1("Verify your email");
    const refresh = vi.spyOn(service, "refreshUser");
    await clickVerificationLink(service, email!);
    await user.click(screen.getByRole("button", { name: "I've verified" }));
    await h1("Settings");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(here(router)).toBe("/settings");
  });

  it("\"I've verified\" while still unverified explains and stays", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/verify-email", { user: { verified: false } });
    await h1("Verify your email");
    const refresh = vi.spyOn(service, "refreshUser");
    await user.click(screen.getByRole("button", { name: "I've verified" }));
    expect(await screen.findByRole("status")).toHaveTextContent("haven't seen your verification");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("auto-checks (with a forced refresh) when the tab regains focus", async () => {
    // The heading shows on DOM commit, before the passive effect adds the window focus listener;
    // a focus event fired earlier is lost. Wait for the listener itself, not the heading.
    const add = vi.spyOn(window, "addEventListener");
    const { service, email } = await renderAuthApp("/verify-email", { user: { verified: false } });
    await h1("Verify your email");
    await waitFor(() => expect(add).toHaveBeenCalledWith("focus", expect.any(Function)));
    add.mockRestore();
    const refresh = vi.spyOn(service, "refreshUser");
    await clickVerificationLink(service, email!);
    act(() => void window.dispatchEvent(new Event("focus")));
    await h1(`Welcome ${localPart(email!)}`);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("Resend asks the email link to come back to ?next=", async () => {
    const user = userEvent.setup();
    const api = stubEmailApi();
    await renderAuthApp("/verify-email?next=%2Fsettings", { emailApi: api, user: { verified: false } });
    await h1("Verify your email");
    api.sendVerification.mockClear();
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    await screen.findByRole("button", { name: /Resend in/ });
    expect(api.sendVerification.mock.calls.map(([, next]) => next)).toEqual(["/settings"]);
  });

  it("the resend cooldown survives leaving and returning to the page, not stored in the browser", async () => {
    const user = userEvent.setup();
    const service = testService(stubEmailApi());
    const { email } = await signUpTestUser(service);
    await renderAuthApp("/verify-email", { service });
    await h1("Verify your email");
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    await screen.findByRole("button", { name: /Resend in/ });
    cleanup();
    await renderAuthApp("/verify-email", { service });
    await h1("Verify your email");
    expect(screen.getByRole("button", { name: /Resend in/ })).toBeDisabled();
    expect(email).toBeTruthy();
  });

  it("\"I've verified\" is busy while checking", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/verify-email", { user: { verified: false } });
    await h1("Verify your email");
    let release!: () => void;
    vi.spyOn(service, "refreshUser").mockImplementationOnce(() => new Promise((r) => (release = () => r(null))));
    await user.click(screen.getByRole("button", { name: "I've verified" }));
    expect(await screen.findByRole("button", { name: "Checking…" })).toBeDisabled();
    release();
    expect(await screen.findByRole("button", { name: "I've verified" })).toBeEnabled();
  });

  it("clears the old note on the next action", async () => {
    const user = userEvent.setup();
    const { service } = await renderAuthApp("/verify-email", { user: { verified: false } });
    await h1("Verify your email");
    await user.click(screen.getByRole("button", { name: "I've verified" }));
    expect(await screen.findByRole("status")).toHaveTextContent("haven't seen your verification");
    vi.spyOn(service, "sendVerificationEmail").mockRejectedValueOnce({ code: "auth/too-many-requests" });
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Google button busy and cancel handling", () => {
  for (const [path, title] of [["/login", "Log in"], ["/signup", "Sign up"]] as const) {
    it(`${path}: disables both buttons while Google is pending`, async () => {
      const user = userEvent.setup();
      const { service } = await renderAuthApp(path);
      await h1(title);
      let release: () => void = () => {};
      vi.spyOn(service, "signInWithGoogle").mockImplementation(() => new Promise<void>((r) => (release = r)));
      const google = screen.getByRole("button", { name: "Continue with Google" });
      await user.click(google);
      expect(google).toBeDisabled();
      expect(screen.getByRole("button", { name: path === "/login" ? "Log in" : "Create account" })).toBeDisabled();
      release();
      await waitFor(() => expect(google).toBeEnabled());
    });

    it(`${path}: a closed or cancelled popup shows no error`, async () => {
      const user = userEvent.setup();
      const { service } = await renderAuthApp(path);
      await h1(title);
      const google = vi.spyOn(service, "signInWithGoogle");
      for (const code of ["auth/popup-closed-by-user", "auth/cancelled-popup-request"]) {
        google.mockRejectedValue({ code });
        await user.click(screen.getByRole("button", { name: "Continue with Google" }));
        await waitFor(() => expect(google).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled());
        expect(screen.queryByRole("alert")).toBeNull();
      }
    });
  }
});

describe("unverified accounts coming back", () => {
  async function fill(user: ReturnType<typeof userEvent.setup>, email: string, password: string, confirm?: string) {
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), password);
    if (confirm) await user.type(screen.getByLabelText("Confirm password"), confirm);
  }

  it("Log in with an unverified account lands on the verify page, without a new email", async () => {
    const user = userEvent.setup();
    const api = stubEmailApi();
    const service = testService(api);
    const { email } = await signUpTestUser(service);
    await service.signOut();
    const { router } = await renderAuthApp("/login", { service });
    await h1("Log in");
    await fill(user, email, TEST_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await h1("Verify your email");
    expect(router.state.location.pathname).toBe("/verify-email");
    expect(api.sendVerification).toHaveBeenCalledTimes(1); // the sign-up's
  });

  it("Sign up with an existing unverified email and the right password lands on the verify page", async () => {
    const user = userEvent.setup();
    const api = stubEmailApi();
    const service = testService(api);
    const { email } = await signUpTestUser(service);
    await service.signOut();
    const { router } = await renderAuthApp("/signup", { service });
    await h1("Sign up");
    await fill(user, email, TEST_PASSWORD, TEST_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await h1("Verify your email");
    expect(router.state.location.pathname).toBe("/verify-email");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(api.sendVerification).toHaveBeenCalledTimes(1);
  });

  it("Sign up with an existing verified email and the right password goes to the app", async () => {
    const user = userEvent.setup();
    const service = testService();
    const { email } = await signUpTestUser(service, { verified: true });
    await service.signOut();
    const { router } = await renderAuthApp("/signup", { service });
    await h1("Sign up");
    await fill(user, email, TEST_PASSWORD, TEST_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/new"));
  });

  it("the verify page never sends an email on mount; only Resend does", async () => {
    const user = userEvent.setup();
    const api = stubEmailApi();
    const service = testService(api);
    const { email } = await signUpTestUser(service);
    api.sendVerification.mockClear();
    await renderAuthApp("/verify-email", { service });
    await h1("Verify your email");
    expect(api.sendVerification).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Resend email" }));
    await screen.findByText(`Verification email sent to ${email}`);
    expect(api.sendVerification).toHaveBeenCalledTimes(1);
  });
});
