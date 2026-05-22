import { expect, test } from "bun:test";
import { safeReply } from "@bot/core";
import type { InteractionEditReplyOptions, InteractionReplyOptions } from "discord.js";

test("safeReply replies when interaction is fresh", async () => {
  const calls: string[] = [];
  await safeReply(
    {
      deferred: false,
      editReply: async (_options: InteractionEditReplyOptions) => {
        calls.push("editReply");
        return {} as Awaited<ReturnType<typeof safeReply>>;
      },
      followUp: async (_options: InteractionReplyOptions) => {
        calls.push("followUp");
        return {} as Awaited<ReturnType<typeof safeReply>>;
      },
      replied: false,
      reply: async (_options: InteractionReplyOptions) => {
        calls.push("reply");
        return {} as Awaited<ReturnType<typeof safeReply>>;
      },
    },
    { content: "hello" },
  );

  expect(calls).toEqual(["reply"]);
});

test("safeReply edits deferred interactions", async () => {
  const calls: string[] = [];
  await safeReply(
    {
      deferred: true,
      editReply: async (_options: InteractionEditReplyOptions) => {
        calls.push("editReply");
        return {} as Awaited<ReturnType<typeof safeReply>>;
      },
      followUp: async (_options: InteractionReplyOptions) => {
        calls.push("followUp");
        return {} as Awaited<ReturnType<typeof safeReply>>;
      },
      replied: false,
      reply: async (_options: InteractionReplyOptions) => {
        calls.push("reply");
        return {} as Awaited<ReturnType<typeof safeReply>>;
      },
    },
    { content: "hello" },
  );

  expect(calls).toEqual(["editReply"]);
});
