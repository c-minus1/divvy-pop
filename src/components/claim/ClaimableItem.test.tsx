// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ClaimableItem from "./ClaimableItem";
import type { LineItem } from "@/types";

afterEach(cleanup);

const noop = () => {};

const item: LineItem = {
  id: "li1",
  name: "TRATA Smashburger (Truffle Fries, No Onion, Add Bacon)",
  price: 17,
  item_order: 0,
};

describe("ClaimableItem", () => {
  it("shows the full item name, wrapped, so similar items stay tellable apart", () => {
    render(
      <ClaimableItem
        item={item}
        claims={[]}
        participants={[]}
        currentUserId="p1"
        onClaim={noop}
        onUnclaim={noop}
      />
    );

    const name = screen.getByText(item.name);
    // Long names must be allowed to break onto multiple lines, left-aligned,
    // rather than stretching or clipping inside the rounded button.
    expect(name.className).toMatch(/break-words/);
    expect(name.className).toMatch(/text-left/);
  });

  it("keeps the price on a single line beside the wrapped name", () => {
    render(
      <ClaimableItem
        item={item}
        claims={[]}
        participants={[]}
        currentUserId="p1"
        onClaim={noop}
        onUnclaim={noop}
      />
    );

    const price = screen.getByText("$17.00");
    expect(price.className).toMatch(/whitespace-nowrap/);
  });
});
