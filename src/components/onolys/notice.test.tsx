import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorNote, Notice } from "./notice";
import { Field } from "./field";

describe("Notice, ErrorNote and Field", () => {
  it("Notice has no role unless asked", () => {
    render(<><Notice>Heads up</Notice><Notice role="status">Live</Notice></>);
    expect(screen.getByText("Heads up").closest("[data-slot=alert]")).not.toHaveAttribute("role");
    expect(screen.getByRole("status")).toHaveTextContent("Live");
  });

  it("ErrorNote is an alert", () => {
    render(<ErrorNote>Broken</ErrorNote>);
    expect(screen.getByRole("alert")).toHaveTextContent("Broken");
  });

  it("Field labels the control by id", () => {
    render(<Field label="Name">{(id) => <input id={id} />}</Field>);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("Field uses the id it is given,", () => {
    render(<Field label="Email" id="fixed-id">{(id) => <input id={id} />}</Field>);
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "fixed-id");
  });
});
