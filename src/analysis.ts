import type { Ctx } from "./bot.js";
import { now } from "./clock.js";
import { inlineButton, inlineKeyboard } from "./toolkit/index.js";

export type Direction = "long" | "short";
export interface Timeframes {
  primary: string;
  secondary: string;
  execution: string;
  confirmation: string;
}
export interface TradeIdea {
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskMath: string;
}
export interface Report {
  labelledChartUrl: string;
  explanationText: string;
  confidenceLevel: "confirmed";
  createdAt: number;
}
export interface AnalysisState {
  chartImage?: { imageUrl: string; timestamp: number; width: number; height: number };
  timeframes: Timeframes;
  tradeIdea?: TradeIdea;
  report?: Report;
  history: Report[];
  retention: number;
}

export const DEFAULT_TIMEFRAMES: Timeframes = {
  primary: "H4",
  secondary: "H1",
  execution: "M15",
  confirmation: "M5",
};

export function state(ctx: Ctx): AnalysisState {
  return (ctx.session.analysis ??= {
    timeframes: { ...DEFAULT_TIMEFRAMES },
    history: [],
    retention: 100,
  });
}

export interface ChartInput {
  direction: Direction;
  entry: number;
  stop: number;
  supply?: number;
  demand?: number;
}

/** Parse explicit chart levels, never infer a price that the trader did not supply. */
export function parseChartInput(caption?: string): ChartInput | undefined {
  if (!caption) return undefined;
  const direction = /\b(long|buy)\b/i.test(caption)
    ? "long"
    : /\b(short|sell)\b/i.test(caption)
      ? "short"
      : undefined;
  const value = (name: string): number | undefined => {
    const match = caption.match(new RegExp(`\\b${name}\\s*[=:]\\s*([0-9]+(?:\\.[0-9]+)?)`, "i"));
    if (!match) return undefined;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };
  const entry = value("entry");
  const stop = value("stop");
  if (!direction || entry === undefined || stop === undefined || entry === stop) return undefined;
  return { direction, entry, stop, supply: value("supply"), demand: value("demand") };
}

function decimals(...values: number[]): number {
  return Math.min(8, Math.max(2, ...values.map((value) => (String(value).split(".")[1]?.length ?? 0))));
}

function format(value: number, places: number): string {
  return value.toFixed(places);
}

export function makeTrade(input: ChartInput): TradeIdea {
  const risk = Math.abs(input.entry - input.stop);
  const target = input.direction === "long" ? input.entry + risk * 2 : input.entry - risk * 2;
  const halfway = input.direction === "long" ? input.entry + risk : input.entry - risk;
  const places = decimals(input.entry, input.stop, target);
  return {
    direction: input.direction,
    entryPrice: input.entry,
    stopLoss: input.stop,
    takeProfit1: halfway,
    takeProfit2: target,
    riskMath: `Risk ${format(risk, places)}; target ${format(risk * 2, places)} (2:1).`,
  };
}

export function analysisKeyboard() {
  return inlineKeyboard([
    [inlineButton("Explain entry", "report:explain_entry")],
    [inlineButton("Show alternate stop", "report:alternate_stop")],
    [inlineButton("Change timeframes", "analysis:change_timeframes")],
    [inlineButton("Back to menu", "menu:main")],
  ]);
}

export function reportText(idea: TradeIdea, frames: Timeframes, input: ChartInput): string {
  const places = decimals(idea.entryPrice, idea.stopLoss, idea.takeProfit2);
  const zoneLine = input.supply !== undefined || input.demand !== undefined
    ? `Supplied levels: supply ${input.supply ?? "not supplied"}; demand ${input.demand ?? "not supplied"}.\n`
    : "No supply or demand level was supplied, so this report does not claim one.\n";
  return `Trade setup: ${idea.direction.toUpperCase()}\n` +
    `Top-down view: ${frames.primary} → ${frames.secondary} → ${frames.execution} → ${frames.confirmation}.\n` +
    zoneLine +
    `Entry ${format(idea.entryPrice, places)}; stop ${format(idea.stopLoss, places)}.\n` +
    `TP1 ${format(idea.takeProfit1, places)}; TP2 ${format(idea.takeProfit2, places)}.\n` +
    idea.riskMath;
}

export function saveReport(ctx: Ctx, report: Report): void {
  const current = state(ctx);
  current.report = report;
  current.history.push(report);
  if (current.history.length > current.retention) {
    current.history.splice(0, current.history.length - current.retention);
  }
}

export function newReport(text: string, imageUrl: string): Report {
  return { labelledChartUrl: imageUrl, explanationText: text, confidenceLevel: "confirmed", createdAt: now() };
}
