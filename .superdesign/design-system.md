# LendMatch — Design System

## Product context

**LendMatch** is an automated peer-to-peer micro-lending matchmaker. An everyday
investor sets two inputs — **risk appetite (0–100)** and **investment amount** —
and the app instantly ranks the open borrower listings from best to worst fit,
recommends the **top five to fund**, and explains every pick.

- **Audience:** retail investors, not quants. Hackathon judges will watch a live
  demo: a conservative setting, then an aggressive one, and expect the top 5 to
  visibly change.
- **JTBD:** "When I have a small amount to lend, show me exactly which borrowers
  to fund, how much to put in each, what I can expect to earn, and how risky it is
  — and let me see it change the moment I change my mind."
- **Single page app.** Everything recomputes in the browser on every slider move.

### Page architecture

- **Header** — rounded logo tile, product name, data-source status pill.
- **Your profile** (sticky sidebar on wide screens) — risk appetite slider with
  profile pill, allowed-grade scale and Conservative / Balanced / Aggressive
  presets; investment amount slider with number input and preset chips.
- **Your portfolio** — navy stat band: allocated, expected return per year,
  blended default risk, interest if all repay.
- **Top 5 to fund** — ranked loan cards: rank tile, business, borrower, grade,
  term, description, interest rate, default risk, expected ROI, a "You lend /
  You earn" panel, a two-segment fit-score bar (safety + return) and one plain
  sentence explaining the rank.
- **Risk vs return** — scatter of default probability against expected ROI.
- **All open listings** — full ranked table with status and exclusion reason.
- **How the score works** — the three formulas with the investor's live values.

## Visual direction

Inspired by the public LenDenClub site (`app.lendenclub.com`), which was given
as the reference: a light, friendly, trust-first fintech look. LendMatch keeps
its own name and mark; only the visual language is borrowed. The logged-in
manual-lending screen sits behind an OTP login and was not available, so the
loan-card layout is our own.

### Color tokens

| Token | Hex | Use |
|---|---|---|
| page | `#F9FAFD` | page background |
| surface | `#FFFFFF` | cards, inputs, table |
| ink | `#1C1C1C` | headings, values |
| body | `#2E3133` | body text |
| muted | `#60676B` | labels, captions |
| line | `#E6EBED` | borders, dividers, slider track |
| fill | `#F1F3F5` | inactive chips, quiet panels |
| primary | `#0099E3` | slider fill, bars, chart highlight, logo tile |
| primary-strong | `#1678B5` | small blue text, active chips (white text passes AA) |
| tint | `#E6F1F8` | "You lend" panel, profile pill, top-5 table rows |
| navy | `#0F172A` | portfolio stat band, formula blocks |
| sky | `#7DD3FC` | numerals on navy |
| lime | `#B1F349` | grade A, "Top 5" pill, accent dot |
| gold | `#FFD166` | grade C |
| coral | `#FF8C69` | grade E, warnings |

Data marks use a validated colour-blind-safe pair: safety `#0099E3`, return
`#E8960C`, neutral `#A8ADB1`. Values are always printed beside the bar, so
colour never carries meaning alone.

### Typography

**Manrope** for everything. Headings and values 800 weight with tight tracking;
labels 12px / 600; body 14–16px / 400–600. Tabular figures in the table.
Formulas use the system monospace stack.

### Shape, elevation, spacing

- Cards: 20px radius, 1px `line` border, soft shadow `0 4px 20px rgb(0 0 0 / 0.07)`.
- Inner panels 16px radius; inputs, chips and buttons 12px; pills fully round;
  grade badges 8px.
- Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48. Card padding 20–24px. Max width 1360px.

### Components

- **Status pill:** white, 1px border, round dot + 12px bold text.
- **Slider:** 6px rounded track, blue fill, 24px white round thumb with a 3px
  blue ring (44px touch target).
- **Chips:** equal-width, 12px radius; active = `primary-strong` with white text,
  inactive = `fill`.
- **Stat band:** navy, sky numerals, white label, thin white/15 dividers;
  2 × 2 on phones, one row from tablet up.
- **Loan card:** rank tile (blue when funded, gray when not), grade badge and
  term pill, three metrics, fit bar, tinted "You lend / You earn" panel,
  gray explanation strip.
- **Table:** tinted header row, top-5 rows tinted with a blue left rule and a
  lime "Top 5" pill.

### Motion

150–260ms, ease-out. Cards slide to their new position when the ranking
changes; bars resize with a width transition. `prefers-reduced-motion` is respected.

## Responsive requirements (must work on any device)

- **Phones (320px+):** single column; table scrolls sideways inside its card;
  a compact copy of both sliders pins to the bottom once the main controls
  scroll away; touch targets ≥ 40px.
- **Tablet (768px+):** the two controls sit side by side; stat band in one row.
- **Wide (1280px+):** controls become a sticky sidebar beside the results.
