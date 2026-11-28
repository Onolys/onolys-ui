import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AuthAction, resolveContinue } from "./AuthAction";

describe("resolveContinue", () => {
  const o = "https://app.example.test";
  const hosts = ["staging.example.test", " Other.Example.Test "];
  it("allows same-origin paths", () => {
    expect(resolveContinue("https://app.example.test/verify-email?x=1", [], o)).toEqual({ kind: "path", path: "/verify-email?x=1" });
    expect(resolveContinue("/settings", [], o)).toEqual({ kind: "path", path: "/settings" });
  });
  it("allows only the injected allowedHosts as external (case-insensitive, trimmed)", () => {
    expect(resolveContinue("https://staging.example.test/verify-email", hosts, o)).toEqual({
      kind: "external",
      href: "https://staging.example.test/verify-email",
    });
    expect(resolveContinue("https://OTHER.example.test/x", hosts, o)).toEqual({ kind: "external", href: "https://other.example.test/x" });
  });
  it("sends a host that is not allowed home, and allows none by default", () => {
    expect(resolveContinue("https://evil.example/verify-email", hosts, o)).toEqual({ kind: "path", path: "/" });
    expect(resolveContinue("https://staging.example.test/verify-email", [], o)).toEqual({ kind: "path", path: "/" });
    expect(resolveContinue("https://staging.example.test.evil.example/", hosts, o)).toEqual({ kind: "path", path: "/" });
  });
  it("never redirects to other origins or odd schemes", () => {
    for (const bad of ["https://evil.example/x", "//evil.example", "javascript:alert(1)", "http://staging.example.test/", "https://app.example.test@evil.example/", null, "http://[bad"]) {
      expect(resolveContinue(bad, hosts, o)).toEqual({ kind: "path", path: "/" });
    }
  });
});

describe("AuthAction", () => {
  it("accepts allowedHosts and shows the invalid-link page when the link has no code", () => {
    render(
      <MemoryRouter initialEntries={["/auth/action?mode=other"]}>
        <AuthAction allowedHosts={["staging.example.test"]} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "This link isn't valid" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to log in" })).toHaveAttribute("href", "/login");
  });
});
