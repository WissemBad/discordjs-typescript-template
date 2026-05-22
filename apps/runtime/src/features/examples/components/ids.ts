import { formatCustomId } from "@bot/core";

/** Centralizes custom ids so component builders and handlers cannot drift apart. */
export const exampleIds = {
  button: formatCustomId({ action: "open", feature: "examples", scope: "button" }),
  modal: formatCustomId({ action: "submit", feature: "examples", scope: "modal" }),
  select: formatCustomId({ action: "choose", feature: "examples", scope: "select" }),
};
