import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  analysisKeyboard,
  makeTrade,
  newReport,
  parseChartInput,
  reportText,
  saveReport,
  state,
} from "../analysis.js";
import { registerMainMenuItem } from "../toolkit/index.js";
import { now } from "../clock.js";

registerMainMenuItem({ label: "Analyze chart", data: "analysis:upload", order: 10 });

const composer = new Composer<Ctx>();

const LEVELS_PROMPT =
  "I need the price levels to calculate the setup accurately. Add a caption or send: long entry=1.0840 stop=1.0800 supply=1.0920 demand=1.0800.";

async function analyse(ctx: Ctx, caption: string | undefined): Promise<void> {
  const current = state(ctx);
  const input = parseChartInput(caption);
  if (!current.chartImage) return;
  if (!input) {
    await ctx.reply(LEVELS_PROMPT);
    return;
  }
  const idea = makeTrade(input);
  current.tradeIdea = idea;
  const text = reportText(idea, current.timeframes, input);
  const report = newReport(text, current.chartImage.imageUrl);
  saveReport(ctx, report);
  // Telegram can reliably return the original uploaded chart. The calculations
  // are in the caption; visual labels are never fabricated over unreadable pixels.
  await ctx.replyWithPhoto(current.chartImage.imageUrl, {
    caption: `Chart analysis\n\n${text}`,
    reply_markup: analysisKeyboard(),
  });
}

composer.callbackQuery("analysis:upload", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "Send an MT5 chart as a photo. For a trade setup, include entry and stop in the caption.",
  );
});

composer.on("message:photo", async (ctx) => {
  const photo = ctx.message.photo.at(-1);
  if (!photo) return;
  if (photo.width < 800 || photo.height < 500) {
    await ctx.reply("This chart is too small to review accurately. Send a clearer screenshot at least 800 × 500 pixels.");
    return;
  }
  const current = state(ctx);
  current.chartImage = {
    imageUrl: photo.file_id,
    timestamp: now(),
    width: photo.width,
    height: photo.height,
  };
  await analyse(ctx, ctx.message.caption);
});

composer.on("message:document", async (ctx) => {
  const mime = ctx.message.document.mime_type ?? "";
  if (mime.startsWith("image/")) {
    await ctx.reply("Send the chart as a Telegram photo so I can verify its resolution before analysis.");
  }
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.message.text.startsWith("/")) return next();
  const current = state(ctx);
  if (!current.chartImage || current.tradeIdea) return next();
  await analyse(ctx, ctx.message.text);
});

export default composer;
