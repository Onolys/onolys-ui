import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { here, renderAuthApp, stubEmailApi, testService } from "../../../test/renderAuthApp";
import { issueActionCode, newTestEmail, signUpTestUser, TEST_PASSWORD } from "../testing";

const h1 = (name: string) => screen.findByRole("heading", { level: 1, name });

/** A signed-out account with a fresh verifyEmail code (codes are issued while signed in, as the app's email route does). */
async function account(opts: { verified?: boolean; emailApi?: ReturnType<typeof stubEmailApi> } = {}) {
  const service = testService(opts.emailApi ?? null);
  const { email, password } = await signUpTestUser(service, { verified: opts.verified });
  const code = opts.verified ? undefined : await issueActionCode(service, "verifyEmail", email);
  await service.signOut();
  return { service, email, password, code: code! };
}

describe("/auth/action verifyEmail", () => {
  it("does not apply the code on load, only on click (link scanners)", async () => {
    const { service, code } = await account();
    const apply = vi.spyOn(service, "applyEmailVerification");
    await renderAuthApp(`/auth/action?mode=verifyEmail&oobCode=${code}&apiKey=AQ.bad`, { service });
    await h1("Verify your email");
    expect(apply).not.toHaveBeenCalled();
    expect(await service.checkEmailVerificationCode(code)).toEqual(expect.any(String)); // still unused
    await userEvent.setup().click(screen.getByRole("button", { name: "Verify my email" }));
    await h1("Email verified");
    expect(apply).toHaveBeenCalledTimes(1);
    await expect(service.checkEmailVerificationCode(code)).rejects.toMatchObject({ code: "auth/invalid-action-code" }); // consumed
  });

  it("continues to the same-origin continueUrl path", async () => {
    const { service, code } = await account();
    const cont = encodeURIComponent(`${window.location.origin}/login`);
    const { router } = await renderAuthApp(`/auth/action?mode=verifyEmail&oobCode=${code}&continueUrl=${cont}`, { service });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Verify my email" }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    await waitFor(() => expect(here(router)).toBe("/login"));
  });

  it("renders for a signed-in unverified user and flips emailVerified", async () => {
    const service = testService();
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyEmail", email);
    await renderAuthApp(`/auth/action?mode=verifyEmail&oobCode=${code}`, { service });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Verify my email" }));
    await h1("Email verified");
    expect((await service.refreshUser())?.emailVerified).toBe(true);
  });

  it("explains an invalid/expired code and offers a new link (log in when signed out)", async () => {
    const { service, code } = await account();
    await service.applyEmailVerification(code); // a used code is as dead as an expired one
    await renderAuthApp(`/auth/action?mode=verifyEmail&oobCode=${code}`, { service });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Verify my email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid, has expired, or was already used");
    expect(screen.getByRole("link", { name: /new verification email/ })).toHaveAttribute("href", "/login");
    // the dead code is no longer offered again (E14)
    expect(screen.queryByRole("button", { name: "Verify my email" })).toBeNull();
    expect(screen.queryByText(/Confirm your email address/)).toBeNull();
  });

  it("links to /verify-email for a new link when signed in", async () => {
    await renderAuthApp("/auth/action?mode=verifyEmail&oobCode=nope", { user: { verified: false } });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Verify my email" }));
    expect(await screen.findByRole("link", { name: "Get a new verification email" })).toHaveAttribute("href", "/verify-email");
  });

  it("shows a generic error for other failures", async () => {
    const { service } = await account();
    vi.spyOn(service, "applyEmailVerification").mockRejectedValue({ code: "auth/network-request-failed" });
    await renderAuthApp("/auth/action?mode=verifyEmail&oobCode=x", { service });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Verify my email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
  });
});

describe("/auth/action continue links (allowedHosts)", () => {
  const ALLOWED = "https://staging.example.test/verify-email";

  async function verifyThenContinue(continueUrl: string, allowedHosts: string[]) {
    const { service, code } = await account();
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, origin: window.location.origin, assign });
    const { router } = await renderAuthApp(
      `/auth/action?mode=verifyEmail&oobCode=${code}&continueUrl=${encodeURIComponent(continueUrl)}`,
      { service, allowedHosts },
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Verify my email" }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    return { assign, router };
  }

  it("sends the user to an allowed external host", async () => {
    const { assign } = await verifyThenContinue(ALLOWED, ["staging.example.test"]);
    expect(assign).toHaveBeenCalledWith(ALLOWED);
  });

  it("does not send the user to a host that is not allowed (goes home instead)", async () => {
    const { assign, router } = await verifyThenContinue(ALLOWED, ["other.example.test"]);
    expect(assign).not.toHaveBeenCalled();
    await waitFor(() => expect(here(router)).not.toBe("/auth/action"));
  });

  it("allows no external host by default", async () => {
    const { assign } = await verifyThenContinue(ALLOWED, []);
    expect(assign).not.toHaveBeenCalled();
  });
});

describe("/auth/action pre-check failures and already verified", () => {
  it("verifyEmail: a signed-in verified user sees Already verified + Continue, not invalid-link copy", async () => {
    await renderAuthApp("/auth/action?mode=verifyEmail&oobCode=used", { user: { verified: true } });
    await h1("Already verified");
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByText(/invalid/)).toBeNull();
  });

  it("verifyEmail: a verified user opening ANOTHER account's valid link is not told 'Already verified' and can verify it (LM-12)", async () => {
    const service = testService();
    const { email: other } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyEmail", other);
    await service.signOut();
    await signUpTestUser(service, { verified: true });
    const check = vi.spyOn(service, "checkEmailVerificationCode");
    const apply = vi.spyOn(service, "applyEmailVerification");
    await renderAuthApp(`/auth/action?mode=verifyEmail&oobCode=${code}`, { service });
    await waitFor(() => expect(check).toHaveBeenCalledTimes(1)); // the signed-in user arrived; the link's owner is checked
    const verify = await screen.findByRole("button", { name: "Verify my email" });
    expect(screen.queryByRole("heading", { name: "Already verified" })).toBeNull();
    expect(apply).not.toHaveBeenCalled(); // checked, not consumed
    await userEvent.setup().click(verify);
    await h1("Email verified");
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("verifyEmail: a verified user opening their OWN still-valid link sees Already verified (case-insensitive)", async () => {
    const service = testService();
    const { email } = await signUpTestUser(service, { email: newTestEmail("Own.Case"), verified: true });
    const code = await issueActionCode(service, "verifyEmail", email.toUpperCase());
    const apply = vi.spyOn(service, "applyEmailVerification");
    await renderAuthApp(`/auth/action?mode=verifyEmail&oobCode=${code}`, { service });
    await h1("Already verified");
    expect(apply).not.toHaveBeenCalled();
  });

  it("resetPassword: a network failure of the pre-check shows the network message and Try again, then recovers", async () => {
    const { service, email } = await account();
    const code = await issueActionCode(service, "resetPassword", email);
    const spy = vi.spyOn(service, "verifyPasswordResetCode").mockRejectedValueOnce({ code: "auth/network-request-failed" });
    await renderAuthApp(`/auth/action?mode=resetPassword&oobCode=${code}`, { service });
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    expect(screen.queryByText(/Reset link expired/)).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    await h1("Choose a new password");
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("change email: a network failure of the pre-check shows the network message and Try again", async () => {
    const service = testService();
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail: newTestEmail("new") });
    await service.signOut();
    vi.spyOn(service, "checkEmailChangeCode").mockRejectedValueOnce({ code: "auth/network-request-failed" });
    await renderAuthApp(`/auth/action?mode=verifyAndChangeEmail&oobCode=${code}`, { service });
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    await h1("Confirm your new email");
  });
});

describe("/auth/action resetPassword", () => {
  it("shows the email, rejects short passwords, then resets", async () => {
    const { service, email } = await account();
    const code = await issueActionCode(service, "resetPassword", email);
    const confirm = vi.spyOn(service, "confirmPasswordReset");
    const { router } = await renderAuthApp(`/auth/action?mode=resetPassword&oobCode=${code}`, { service });
    const user = userEvent.setup();
    await h1("Choose a new password");
    expect(screen.getByText(email)).toBeInTheDocument();
    await user.type(screen.getByLabelText("New password"), "short");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at least 8 characters");
    expect(confirm).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("New password"));
    await user.type(screen.getByLabelText("New password"), "longenough1x");
    await user.click(screen.getByRole("button", { name: "Update password" }));
    await h1("Log in");
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(here(router)).toBe("/login");
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Password updated");
    expect(screen.getByLabelText("Email")).toHaveValue(email);
    await service.signIn(email, "longenough1x");
  });

  it("shows an expired message for a bad code", async () => {
    await renderAuthApp("/auth/action?mode=resetPassword&oobCode=bad");
    await h1("Reset link expired");
    expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute("href", "/forgot-password");
  });
});

/** A signed-out account plus a verifyAndChangeEmail code for moving it to `newEmail`. */
async function changeCode() {
  const service = testService();
  const { email, password } = await signUpTestUser(service);
  const newEmail = newTestEmail("new");
  const code = await issueActionCode(service, "verifyAndChangeEmail", email, { newEmail });
  await service.signOut();
  return { service, email, password, newEmail, code };
}

describe("/auth/action verifyAndChangeEmail", () => {
  it("shows the new email, applies only on click, then asks a signed-out user to log in with it", async () => {
    const { service, password, newEmail, code } = await changeCode();
    const apply = vi.spyOn(service, "applyEmailChange");
    await renderAuthApp(`/auth/action?mode=verifyAndChangeEmail&oobCode=${code}&apiKey=AQ.bad`, { service });
    await h1("Confirm your new email");
    expect(screen.getByText(newEmail)).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Confirm new email" }));
    await h1("Email updated");
    expect(apply).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(newEmail);
    expect(screen.getByRole("status")).toHaveTextContent("Log in again with your new email");
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    await service.signIn(newEmail, password);
  });

  it("explains an invalid/expired code without offering to apply it", async () => {
    const { service, code } = await changeCode();
    await service.applyEmailChange(code); // a used code is as dead as an expired one
    const apply = vi.spyOn(service, "applyEmailChange");
    await renderAuthApp(`/auth/action?mode=verifyAndChangeEmail&oobCode=${code}`, { service });
    await h1("Link expired");
    expect(screen.getByRole("alert")).toHaveTextContent("invalid, has expired, or was already used");
    expect(screen.queryByRole("button", { name: "Confirm new email" })).toBeNull();
    expect(apply).not.toHaveBeenCalled();
  });

  it("shows an error when applying fails with an expired code", async () => {
    const { service, code } = await changeCode();
    await renderAuthApp(`/auth/action?mode=verifyAndChangeEmail&oobCode=${code}`, { service });
    vi.spyOn(service, "applyEmailChange").mockRejectedValue({ code: "auth/expired-action-code" });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Confirm new email" }));
    await h1("Link expired");
  });

  it("shows a generic error for other apply failures and keeps the button", async () => {
    const { service, code } = await changeCode();
    await renderAuthApp(`/auth/action?mode=verifyAndChangeEmail&oobCode=${code}`, { service });
    vi.spyOn(service, "applyEmailChange").mockRejectedValue({ code: "auth/network-request-failed" });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Confirm new email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
    expect(screen.getByRole("button", { name: "Confirm new email" })).toBeInTheDocument();
  });

  it("when still signed in, offers Continue to the safe continueUrl", async () => {
    const { service, email, password, code } = await changeCode();
    await service.signIn(email, password); // the emulator keeps this session alive across the change
    const cont = encodeURIComponent(`${window.location.origin}/login`);
    const { router } = await renderAuthApp(`/auth/action?mode=verifyAndChangeEmail&oobCode=${code}&continueUrl=${cont}`, { service });
    const visited: string[] = [];
    router.subscribe((state) => visited.push(state.location.pathname));
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Confirm new email" }));
    await h1("Email updated");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    // /login is where the continueUrl points; the signed-in, verified user is then sent on by the guard.
    await waitFor(() => expect(visited).toContain("/login"));
  });
});

describe("/auth/action recoverEmail", () => {
  /** A signed-out account whose email was changed; the code restores `email`. */
  async function recoverCode(emailApi?: ReturnType<typeof stubEmailApi>) {
    const service = testService(emailApi ?? null);
    const { email } = await signUpTestUser(service);
    const code = await issueActionCode(service, "recoverEmail", email, { newEmail: newTestEmail("moved") });
    await service.signOut();
    return { service, email, code };
  }

  it("shows the restored email, applies only on click, then suggests a password reset", async () => {
    const api = stubEmailApi();
    const { service, email, code } = await recoverCode(api);
    const apply = vi.spyOn(service, "applyEmailChange");
    await renderAuthApp(`/auth/action?mode=recoverEmail&oobCode=${code}`, { service });
    await h1("Restore your email");
    expect(screen.getByText(email)).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Restore this email" }));
    await h1("Email restored");
    expect(apply).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(email);
    expect(api.sendPasswordReset).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reset my password" }));
    expect(await screen.findByText(/reset email sent/i)).toBeInTheDocument();
    expect(api.sendPasswordReset.mock.calls.map(([to]) => to)).toEqual([email]);
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    await service.signIn(email, TEST_PASSWORD); // the restore went through
  });

  it("explains an invalid/expired code", async () => {
    await renderAuthApp("/auth/action?mode=recoverEmail&oobCode=bad");
    await h1("Link expired");
    expect(screen.getByRole("alert")).toHaveTextContent("invalid, has expired, or was already used");
    expect(screen.queryByRole("button", { name: "Restore this email" })).toBeNull();
  });

  it("shows an error when the password reset email fails", async () => {
    const { service, code } = await recoverCode();
    await renderAuthApp(`/auth/action?mode=recoverEmail&oobCode=${code}`, { service });
    vi.spyOn(service, "sendPasswordReset").mockRejectedValue({ code: "auth/too-many-requests" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Restore this email" }));
    await user.click(await screen.findByRole("button", { name: "Reset my password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
  });
});

describe("/auth/action revertSecondFactorAddition", () => {
  it("is treated as not valid (MFA is not used) and never applies a code", async () => {
    const { service } = await account();
    const apply = vi.spyOn(service, "applyEmailChange");
    await renderAuthApp("/auth/action?mode=revertSecondFactorAddition&oobCode=x", { service });
    await h1("This link isn't valid");
    expect(screen.getByText(/two-step verification isn't used/i)).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });
});

describe("/auth/action other", () => {
  it.each(["/auth/action", "/auth/action?mode=other&oobCode=x", "/auth/action?mode=verifyEmail", "/auth/action?mode=resetPassword", "/auth/action?mode=recoverEmail", "/auth/action?mode=verifyAndChangeEmail"])(
    "%s is not valid",
    async (path) => {
      await renderAuthApp(path);
      await h1("This link isn't valid");
    },
  );
});
