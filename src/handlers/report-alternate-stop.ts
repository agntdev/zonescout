import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { analysisKeyboard, state } from "../analysis.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("report:alternate_stop", async (ctx) => {
  await ctx.answerCallbackQuery();
  const idea = state(ctx).tradeIdea;
  if (!idea) {
    await ctx.reply("No trade setup is available yet — send an MT5 chart with entry and stop levels.");
    return;
  }
  const risk = Math.abs(idea.entryPrice - idea.stopLoss);
  const alternativeStop = idea.direction === "long" ? idea.stopLoss - risk * 0.5 : idea.stopLoss + risk * 0.5;
  const alternativeRisk = Math.abs(idea.entryPrice - alternativeStop);
  const alternativeTarget = idea.direction === "long"
    ? idea.entryPrice + alternativeRisk * 2
    : idea.entryPrice - alternativeRisk * 2;
  const places = Math.max(2, ...[idea.entryPrice, alternativeStop, alternativeTarget].map((v) => String(v).split(".")[1]?.length ?? 0));
  await ctx.reply(
    `Alternate stop: ${alternativeStop.toFixed(places)}. ` +
      `Risk becomes ${alternativeRisk.toFixed(places)}; a 2:1 TP2 becomes ${alternativeTarget.toFixed(places)}. ` +
      `Use it only if the wider invalidation level is valid on your chart.`,
    { reply_markup: analysisKeyboard() },
  );
});

export default composer;
