// Runs against the Firebase Auth emulator: `npm run test:auth` (under `firebase emulators:exec --only auth`).
import { describe, expect, it, vi } from "vitest";
import { createTestAuthService, signOutTestServices, signUpTestUser } from "./testing";

describe("test service helpers", () => {
  it("skips the redirect check, which jsdom cannot run", async () => {
    expect(await createTestAuthService().consumeRedirectError()).toBeUndefined();
  });

  it("signOutTestServices signs out every service created since the last call, once", async () => {
    const first = createTestAuthService();
    const second = createTestAuthService();
    const spies = [vi.spyOn(first, "signOut"), vi.spyOn(second, "signOut")];
    await signUpTestUser(first);
    expect(await first.getToken()).toEqual(expect.any(String));
    await signOutTestServices();
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    expect(await first.getToken()).toBeNull();
    await signOutTestServices();
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  });
});
