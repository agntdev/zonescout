import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { analysisKeyboard, state } from "../analysis.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("report:explain_entry", async (ctx) => {
  await ctx.answerCallbackQuery();
  const current = state(ctx);
  const idea = current.tradeIdea;
  if (!idea || !current.report) {
    await ctx.reply("No chart analysis is available yet — send an MT5 chart to create one.");
    return;
  }
  const direction = idea.direction === "long" ? "above" : "below";
  await ctx.reply(
    `Entry rationale: enter only after price confirms ${direction} your supplied entry level. ` +
      `The stop defines the invalidation point, and TP2 remains exactly twice that risk. ` +
      `Confidence is confirmed only for the levels you supplied; the chart itself is not used to invent levels.`,
    { reply_markup: analysisKeyboard() },
  );
});

export default composer;
