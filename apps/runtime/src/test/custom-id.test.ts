import { expect, test } from "bun:test";
import { formatCustomId, parseCustomId } from "@bot/core";

test("formats and parses custom ids", () => {
  const customId = formatCustomId({
    action: "open",
    feature: "examples",
    id: "123",
    scope: "button",
  });

  expect(customId).toBe("examples:button:open:123");
  expect(parseCustomId(customId)).toEqual({
    action: "open",
    feature: "examples",
    id: "123",
    scope: "button",
  });
});

test("rejects invalid custom id segments", () => {
  expect(() =>
    formatCustomId({
      action: "open",
      feature: "Examples",
      scope: "button",
    }),
  ).toThrow();
});

test("rejects malformed parsed custom ids", () => {
  expect(() => parseCustomId("examples:button:Open")).toThrow();
});
