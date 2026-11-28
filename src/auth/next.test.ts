import { describe, expect, it } from "vitest";
import { loginUrl, readNext, verifyContinueUrl, withNext } from "./next";

describe("next param", () => {
  it("accepts same-origin paths", () => {
    expect(readNext("?next=%2Fsessions%2Fabc")).toBe("/sessions/abc");
    expect(readNext("?next=%2Fsessions%2Fnew%3Fa%3D1")).toBe("/sessions/new?a=1");
  });
  it("rejects open redirects and junk, defaulting to /", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", "x"]) {
      expect(readNext(`?next=${encodeURIComponent(bad)}`)).toBe("/");
    }
    expect(readNext("")).toBe("/");
  });
  it("rejects control characters and auth pages as targets", () => {
    for (const bad of ["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/a\u0000b", "/login", "/login?next=%2F", "/signup", "/forgot-password", "/auth/action?mode=x", "/auth/action"]) {
      expect(readNext(`?next=${encodeURIComponent(bad)}`)).toBe("/");
    }
    expect(readNext("?next=%2Floginx")).toBe("/loginx");
  });
  it("builds login URLs and carries next across links", () => {
    expect(loginUrl("/sessions/abc", "?x=1")).toBe("/login?next=%2Fsessions%2Fabc%3Fx%3D1");
    expect(loginUrl("/", "")).toBe("/login");
    expect(withNext("/signup", "?next=%2Fsettings")).toBe("/signup?next=%2Fsettings");
    expect(withNext("/signup", "")).toBe("/signup");
  });
  it("builds the verification continue URL, keeping next", () => {
    expect(verifyContinueUrl("https://app.example", "/settings?a=1")).toBe("https://app.example/verify-email?next=%2Fsettings%3Fa%3D1");
    expect(verifyContinueUrl("https://app.example", "/")).toBe("https://app.example/verify-email");
    expect(verifyContinueUrl("https://app.example")).toBe("https://app.example/verify-email");
  });
});
