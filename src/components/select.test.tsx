import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Label, Select } from "../index";

const options = (
  <>
    <option value="">Choose language</option>
    <optgroup label="Languages">
      <option value="en">English</option>
      <option value="fr">French</option>
      <option value="de" disabled>
        German
      </option>
    </optgroup>
  </>
);

describe("native Select", () => {
  it("uses a real select with native options, a label, an accessible target, and a ref", async () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <>
        <Label htmlFor="language">Language</Label>
        <Select id="language" ref={ref}>
          {options}
        </Select>
      </>,
    );
    const select = screen.getByRole("combobox", { name: "Language" });
    expect(select.tagName).toBe("SELECT");
    expect(ref.current).toBe(select);
    expect(select).toHaveClass(
      "min-h-11",
      "focus-visible:ring-[3px]",
      "focus-visible:ring-ring",
    );
    await userEvent.setup().selectOptions(select, "fr");
    expect(select).toHaveValue("fr");
    expect(screen.getByRole("option", { name: "German" })).toBeDisabled();
    expect(document.querySelectorAll("style")).toHaveLength(0);
  });

  it("supports controlled values and standard change callbacks", async () => {
    const change = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("en");
      return (
        <Select
          aria-label="Language"
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            change(event.currentTarget.value);
          }}
        >
          {options}
        </Select>
      );
    }
    render(<Controlled />);
    const select = screen.getByRole("combobox", { name: "Language" });
    expect(select).toHaveValue("en");
    await userEvent.setup().selectOptions(select, "fr");
    expect(change).toHaveBeenLastCalledWith("fr");
    expect(select).toHaveValue("fr");
  });

  it("participates in required validation, form serialization, and form reset", async () => {
    render(
      <form aria-label="Preferences">
        <Select name="language" required defaultValue="" aria-label="Language">
          {options}
        </Select>
        <button type="reset">Reset</button>
      </form>,
    );
    const select = screen.getByRole("combobox", { name: "Language" });
    const form = screen.getByRole("form", {
      name: "Preferences",
    }) as HTMLFormElement;
    expect(select).toBeInvalid();
    await userEvent.setup().selectOptions(select, "en");
    expect(select).toBeValid();
    expect(new FormData(form).get("language")).toBe("en");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reset" }));
    expect(select).toHaveValue("");
    expect(select).toBeInvalid();
  });

  it("supports disabled fieldsets, separate form ownership, and multiple selection", async () => {
    const { rerender } = render(
      <>
        <form id="preferences" aria-label="Preferences" />
        <fieldset disabled>
          <Select
            form="preferences"
            name="language"
            aria-label="Language"
            defaultValue="en"
          >
            {options}
          </Select>
        </fieldset>
      </>,
    );
    expect(screen.getByRole("combobox", { name: "Language" })).toBeDisabled();
    const form = screen.getByRole("form", {
      name: "Preferences",
    }) as HTMLFormElement;
    expect(new FormData(form).has("language")).toBe(false);
    rerender(
      <>
        <form id="preferences" aria-label="Preferences" />
        <Select
          form="preferences"
          multiple
          name="language"
          aria-label="Languages"
        >
          {options}
        </Select>
      </>,
    );
    await userEvent
      .setup()
      .selectOptions(screen.getByRole("listbox", { name: "Languages" }), [
        "en",
        "fr",
      ]);
    expect(
      new FormData(screen.getByRole("form") as HTMLFormElement).getAll(
        "language",
      ),
    ).toEqual(["en", "fr"]);
  });

  it("keeps native size, disabled, onInvalid, and caller class overrides", () => {
    const invalid = vi.fn();
    render(
      <Select
        aria-label="Language"
        size={3}
        required
        onInvalid={invalid}
        className="w-full"
        defaultValue=""
      >
        {options}
      </Select>,
    );
    const select = screen.getByRole("listbox", { name: "Language" });
    expect(select).toHaveAttribute("size", "3");
    expect(select).toHaveClass("w-full");
    fireEvent.invalid(select);
    expect(invalid).toHaveBeenCalledOnce();
  });
});
