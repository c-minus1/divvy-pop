// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import LineItemRow from "./LineItemRow";

afterEach(cleanup);

const noop = () => {};

describe("LineItemRow", () => {
  it("renders the item name in a multiline control so long names wrap instead of clipping", () => {
    // Real-world case: two "TRATA Smashburger" rows distinguishable only by
    // the side dish, which a single-line <input> clips out of view.
    const longName = "TRATA Smashburger (Truffle Fries, No Onion)";
    render(
      <LineItemRow
        name={longName}
        price={17}
        onNameChange={noop}
        onPriceChange={noop}
        onDelete={noop}
      />
    );

    const nameField = screen.getByPlaceholderText("Item name");
    expect(nameField.tagName).toBe("TEXTAREA");
    expect((nameField as HTMLTextAreaElement).value).toBe(longName);
  });

  it("sizes the name field to its content via a mirrored sizer element", () => {
    // The textarea is stacked on top of an invisible mirror that carries the
    // same text, so the row grows to fit however many lines the name needs.
    const longName = "Caesar Salad (Grilled Chicken, Dressing on the Side)";
    const { container } = render(
      <LineItemRow
        name={longName}
        price={28.5}
        onNameChange={noop}
        onPriceChange={noop}
        onDelete={noop}
      />
    );

    const mirror = container.querySelector('[aria-hidden="true"]');
    expect(mirror).not.toBeNull();
    expect(mirror!.textContent).toContain(longName);
  });

  it("reports name edits through onNameChange", () => {
    const onNameChange = vi.fn();
    render(
      <LineItemRow
        name="Caesar Salad"
        price={13.5}
        onNameChange={onNameChange}
        onPriceChange={noop}
        onDelete={noop}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Item name"), {
      target: { value: "Caesar Salad (Grilled Chicken)" },
    });
    expect(onNameChange).toHaveBeenCalledWith("Caesar Salad (Grilled Chicken)");
  });

  it("keeps newlines out of the name when text is pasted with line breaks", () => {
    const onNameChange = vi.fn();
    render(
      <LineItemRow
        name="Steamed Buns"
        price={14.5}
        onNameChange={onNameChange}
        onPriceChange={noop}
        onDelete={noop}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Item name"), {
      target: { value: "Steamed\nBuns" },
    });
    expect(onNameChange).toHaveBeenCalledWith("Steamed Buns");
  });

  it("still edits price and deletes the row", () => {
    const onPriceChange = vi.fn();
    const onDelete = vi.fn();
    render(
      <LineItemRow
        name="Tropin Thunder"
        price={13}
        onNameChange={noop}
        onPriceChange={onPriceChange}
        onDelete={onDelete}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("$ 0.00"), {
      target: { value: "14.5" },
    });
    expect(onPriceChange).toHaveBeenCalledWith(14.5);

    fireEvent.click(screen.getByLabelText("Remove item"));
    expect(onDelete).toHaveBeenCalled();
  });
});
