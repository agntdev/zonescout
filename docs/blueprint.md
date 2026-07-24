# MT5 Chart Analyzer — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A private Telegram bot for a single trader that analyzes uploaded MT5 chart images to identify supply/demand zones, key levels, and trade setups with 2:1 risk-reward ratios. Returns labeled charts and written explanations for top-down analysis across H4, H1, M15 timeframes.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- individual trader
- MT5 user

## Success criteria

- Generates labeled chart image with analysis
- Provides clear written explanation of trade setup and risk math
- Handles follow-up requests for alternate scenarios

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu for chart analysis
- **Send chart image** (command, actor: user, command: /image_upload) — Trigger analysis by uploading an MT5 chart screenshot
- **Explain entry** (button, actor: user, callback: report:explain_entry) — Request detailed rationale for trade entry point
- **Show alternate stop** (button, actor: user, callback: report:alternate_stop) — Request alternative stop-loss placement options
- **Re-run with different timeframes** (button, actor: user, callback: analysis:change_timeframes) — Adjust timeframes for top-down analysis

## Flows

### chart_analysis
_Trigger:_ image_upload

1. Receive and validate chart image
2. Detect supply/demand zones and key levels
3. Calculate 2:1 risk-reward trade setup
4. Generate labeled chart image
5. Compose written explanation across timeframes

_Data touched:_ chart_image, timeframes, trade_idea, report

### follow_up_explanation
_Trigger:_ report:explain_entry

1. Retrieve latest analysis
2. Expand explanation for entry logic and confidence indicators

_Data touched:_ report

### alternate_stop_request
_Trigger:_ report:alternate_stop

1. Recalculate stop-loss scenarios
2. Display alternative positions with risk math

_Data touched:_ trade_idea

### timeframe_adjustment
_Trigger:_ analysis:change_timeframes

1. Prompt for new timeframe selection
2. Re-analyze chart with updated timeframes
3. Generate revised report

_Data touched:_ timeframes, report

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **chart_image** _(retention: session)_ — User-uploaded MT5 chart screenshot for analysis
  - fields: image_url, timestamp
- **timeframes** _(retention: persistent)_ — Selected timeframes for top-down analysis (defaults: H4, H1, M15, M5)
  - fields: primary, secondary
- **trade_idea** _(retention: persistent)_ — Calculated trade setup with 2:1 risk-reward parameters
  - fields: entry_price, stop_loss, take_profit_1, take_profit_2, risk_math
- **report** _(retention: persistent)_ — Analysis output containing chart annotations and textual rationale
  - fields: labelled_chart_url, explanation_text, confidence_level

## Integrations

- **Telegram** (required) — Private bot messaging and image processing
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure retention policy for analysis history (default: 100 entries)

## Notifications

- Labeled chart image with analysis
- Written explanation of trade setup and reasoning

## Permissions & privacy

- All data is private to the single admin
- No third-party data sharing
- Image analysis occurs locally within bot context

## Edge cases

- Invalid/non-chart image uploads
- Ambiguous price levels requiring clarification
- Unsupported timeframe combinations
- Image resolution too low for accurate analysis

## Required tests

- End-to-end chart analysis flow from image upload to report delivery
- Follow-up button interactions with existing analysis data
- Retention policy enforcement for historical reports

## Assumptions

- Analysis is performed using bot's internal logic without external API dependencies
- User provides properly formatted MT5 chart images
- Default timeframes cover practical top-down context
