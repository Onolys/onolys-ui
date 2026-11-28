import { describe, expect, it } from "vitest";
import * as auth from "./index";
import * as root from "../index";

describe("AUTH_PATHS", () => {
  it("fixes the five sign-in routes", () => {
    expect(auth.AUTH_PATHS).toEqual({
      login: "/login",
      signup: "/signup",
      forgotPassword: "/forgot-password",
      verifyEmail: "/verify-email",
      action: "/auth/action",
    });
  });
  it("is exported from the root and from /auth as the same object", () => {
    expect(root.AUTH_PATHS).toBe(auth.AUTH_PATHS);
  });
});
