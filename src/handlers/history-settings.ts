import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { state } from "../analysis.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Set history limit", data: "history:settings", order: 30 });

const composer = new Composer<Ctx>();
const picker = inlineKeyboard([
  [inlineButton("Keep 25 reports", "history:set:25"), inlineButton("Keep 100 reports", "history:set:100")],
  [inlineButton("Keep 250 reports", "history:set:250")],
  [inlineButton("Back to menu", "menu:main")],
]);

composer.callbackQuery("history:settings", async (ctx) => {
  await ctx.answerCallbackQuery();
  const current = state(ctx);
  await ctx.editMessageText(`You currently keep ${current.retention} reports. Choose a history limit.`, { reply_markup: picker });
});

composer.on("callback_query:data", async (ctx, next) => {
  if (!ctx.callbackQuery.data.startsWith("history:set:")) return next();
  await ctx.answerCallbackQuery();
  const value = Number(ctx.callbackQuery.data.slice("history:set:".length));
  if (![25, 100, 250].includes(value)) {
    await ctx.reply("That history limit is not supported. Choose one of the listed limits.");
    return;
  }
  const current = state(ctx);
  current.retention = value;
  if (current.history.length > value) current.history.splice(0, current.history.length - value);
  await ctx.editMessageText(`History limit set to ${value} reports.`, {
    reply_markup: inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]),
  });
});

export default composer;
