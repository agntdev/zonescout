import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { analysisKeyboard, newReport, reportText, saveReport, state, type Timeframes } from "../analysis.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Change timeframes", data: "analysis:change_timeframes", order: 20 });

const composer = new Composer<Ctx>();

const choices: Record<string, Timeframes> = {
  standard: { primary: "H4", secondary: "H1", execution: "M15", confirmation: "M5" },
  swing: { primary: "D1", secondary: "H4", execution: "H1", confirmation: "M15" },
  intraday: { primary: "H1", secondary: "M15", execution: "M5", confirmation: "M1" },
};

const picker = inlineKeyboard([
  [inlineButton("Standard H4 to M5", "analysis:frames:standard")],
  [inlineButton("Swing D1 to M15", "analysis:frames:swing")],
  [inlineButton("Intraday H1 to M1", "analysis:frames:intraday")],
  [inlineButton("Back to menu", "menu:main")],
]);

composer.callbackQuery("analysis:change_timeframes", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Choose a supported top-down timeframe set.", { reply_markup: picker });
});

composer.on("callback_query:data", async (ctx, next) => {
  const key = ctx.callbackQuery.data.replace("analysis:frames:", "");
  const frames = choices[key];
  if (!ctx.callbackQuery.data.startsWith("analysis:frames:")) return next();
  await ctx.answerCallbackQuery();
  if (!frames) {
    await ctx.reply("That timeframe set is not supported. Choose one of the listed sets.");
    return;
  }
  const current = state(ctx);
  current.timeframes = { ...frames };
  if (!current.tradeIdea || !current.chartImage) {
    await ctx.editMessageText(
      "Timeframes saved. Send an MT5 chart with entry and stop levels to run the analysis.",
      { reply_markup: analysisKeyboard() },
    );
    return;
  }
  const text = reportText(current.tradeIdea, frames, {
    direction: current.tradeIdea.direction,
    entry: current.tradeIdea.entryPrice,
    stop: current.tradeIdea.stopLoss,
  });
  saveReport(ctx, newReport(text, current.chartImage.imageUrl));
  await ctx.editMessageText(`Revised analysis\n\n${text}`, { reply_markup: analysisKeyboard() });
});

export default composer;
